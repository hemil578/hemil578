#!/usr/bin/env python3
"""按剪辑决策表(EDL)渲染成片。

用法: build.py edl.json [--dry-run]

EDL 结构见 SKILL.md。这个脚本只负责忠实执行决策，
所有"剪哪里、什么顺序、什么调性"的判断都由 agent 在上游完成。
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

# 调性预设：每个 look 是一段作用于单个片段的 filter 链
LOOKS = {
    "none": "",
    "clean": "eq=contrast=1.06:saturation=1.05,unsharp=5:5:0.4",
    "film": "curves=preset=medium_contrast,eq=saturation=0.92:gamma=1.02,"
            "colorbalance=rs=-0.04:bs=0.06,vignette=PI/5",
    "warm": "eq=contrast=1.05:saturation=1.12,colorbalance=rs=0.07:gs=0.02:bs=-0.06",
    "cool": "eq=contrast=1.05:saturation=1.02,colorbalance=rs=-0.06:bs=0.08",
    "soft": "eq=contrast=0.95:brightness=0.04:saturation=0.94,gblur=sigma=0.4",
    "vivid": "eq=contrast=1.14:saturation=1.3,unsharp=5:5:0.7",
    # 阴天/漫射光素材：提对比拉通透，中间调轻微去青，锐化克制避免白边
    "fresh": "curves=preset=lighter,eq=contrast=1.12:saturation=1.14:gamma=1.02,"
             "colorbalance=rm=0.04:bm=-0.05,unsharp=5:5:0.18",
    "bw": "hue=s=0,eq=contrast=1.12",
}

ASPECTS = {
    "9:16": (1080, 1920),
    "16:9": (1920, 1080),
    "1:1": (1080, 1080),
    "4:5": (1080, 1350),
    "3:4": (1080, 1440),
}


def fail(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def seg_video_chain(idx, seg, w, h, fps, look, fill_mode):
    """构建单个片段的视频 filter 链，返回 (filter字符串, 输出label)。"""
    parts = [f"trim=start={seg['in']}:end={seg['out']}", "setpts=PTS-STARTPTS"]

    speed = float(seg.get("speed", 1.0))
    if speed != 1.0:
        parts.append(f"setpts=PTS/{speed}")

    if fill_mode == "blur_pad":
        # 竖屏放横屏素材时常用：模糊铺底 + 原片居中
        chain = (
            f"[{idx}:v]{','.join(parts)},split=2[bg{idx}][fg{idx}];"
            f"[bg{idx}]scale={w}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h},gblur=sigma=28[bgb{idx}];"
            f"[fg{idx}]scale={w}:{h}:force_original_aspect_ratio=decrease[fgs{idx}];"
            f"[bgb{idx}][fgs{idx}]overlay=(W-w)/2:(H-h)/2"
        )
        tail = [f"fps={fps}", "format=yuv420p", "setsar=1"]
        if look:
            tail.insert(0, look)
        return f"{chain},{','.join(tail)}[v{idx}]", f"v{idx}"

    if fill_mode == "pad":
        parts.append(f"scale={w}:{h}:force_original_aspect_ratio=decrease")
        parts.append(f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black")
    else:  # crop：填满画面，裁掉多余部分
        parts.append(f"scale={w}:{h}:force_original_aspect_ratio=increase")
        parts.append(f"crop={w}:{h}")

    if look:
        parts.append(look)
    parts += [f"fps={fps}", "format=yuv420p", "setsar=1"]
    return f"[{idx}:v]{','.join(parts)}[v{idx}]", f"v{idx}"


def build_filtergraph(edl, w, h, fps, look, fill_mode):
    segs = edl["segments"]
    trans = edl.get("transition") or {}
    ttype = trans.get("type", "cut")
    tdur = float(trans.get("duration", 0.4))

    chains = []
    labels = []
    for i, seg in enumerate(segs):
        chain, label = seg_video_chain(i, seg, w, h, fps, look, fill_mode)
        chains.append(chain)
        labels.append(label)

    seg_durs = [(s["out"] - s["in"]) / float(s.get("speed", 1.0)) for s in segs]

    if len(labels) == 1:
        vout = labels[0]
        total = seg_durs[0]
    elif ttype in ("fade", "dissolve", "fadeblack", "wipeleft", "slideleft", "smoothleft"):
        xf = {"fade": "fade", "dissolve": "dissolve", "fadeblack": "fadeblack",
              "wipeleft": "wipeleft", "slideleft": "slideleft",
              "smoothleft": "smoothleft"}[ttype]
        # xfade 只能两两做，串成链；每次衔接总时长减少一个转场时长
        cur = labels[0]
        elapsed = seg_durs[0]
        for i in range(1, len(labels)):
            d = min(tdur, max(0.1, seg_durs[i] / 2), max(0.1, elapsed / 2))
            offset = round(elapsed - d, 3)
            out = f"x{i}"
            chains.append(f"[{cur}][{labels[i]}]xfade=transition={xf}:duration={d}:offset={offset}[{out}]")
            elapsed = elapsed + seg_durs[i] - d
            cur = out
        vout = cur
        total = elapsed
    else:  # 硬切
        chains.append(f"{''.join(f'[{l}]' for l in labels)}concat=n={len(labels)}:v=1:a=0[vcat]")
        vout = "vcat"
        total = sum(seg_durs)

    return chains, vout, round(total, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("edl")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    edl = json.loads(Path(args.edl).expanduser().read_text())
    segs = edl.get("segments") or []
    if not segs:
        fail("EDL 里没有 segments")

    aspect = edl.get("aspect", "9:16")
    if "resolution" in edl:
        w, h = edl["resolution"]
    elif aspect in ASPECTS:
        w, h = ASPECTS[aspect]
    else:
        fail(f"未知 aspect: {aspect}")

    fps = int(edl.get("fps", 30))
    look_name = edl.get("look", "clean")
    if look_name not in LOOKS:
        fail(f"未知 look: {look_name}，可选 {list(LOOKS)}")
    look = LOOKS[look_name]
    fill_mode = edl.get("fill_mode", "crop")
    out_path = Path(edl.get("output", "output.mp4")).expanduser()

    for s in segs:
        if not Path(s["src"]).expanduser().exists():
            fail(f"素材不存在: {s['src']}")
        if s["out"] <= s["in"]:
            fail(f"片段区间非法: {s}")

    chains, vout, total = build_filtergraph(edl, w, h, fps, look, fill_mode)

    # 标题字幕：挂在拼接完成后的视频链末端，作用于整条时间线
    title = edl.get("title")
    if title:
        ass_path = Path(title["ass"]).expanduser()
        if not ass_path.exists():
            fail(f"标题 ass 文件不存在: {ass_path}")
        fonts_dir = Path(title.get("fonts_dir", "~/.cola/assets/fonts")).expanduser()
        esc = str(ass_path).replace("\\", "/").replace(":", r"\\:").replace("'", r"\\'")
        opts = [f"filename={esc}"]
        if fonts_dir.exists():
            opts.append(f"fontsdir={str(fonts_dir)}")
        chains.append(f"[{vout}]ass={':'.join(opts)}[vtitle]")
        vout = "vtitle"

    inputs = []
    for s in segs:
        inputs += ["-i", str(Path(s["src"]).expanduser())]

    bgm = edl.get("bgm")
    keep_orig = bool(edl.get("keep_original_audio", False))
    aout = None

    if keep_orig:
        # 保留原声：逐段 atrim 后拼接（缺音轨的片段补静音）
        a_labels = []
        for i, s in enumerate(segs):
            has_audio = subprocess.run(
                ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
                 "stream=index", "-of", "csv=p=0", str(Path(s["src"]).expanduser())],
                capture_output=True, text=True).stdout.strip()
            dur = (s["out"] - s["in"]) / float(s.get("speed", 1.0))
            if has_audio:
                sp = float(s.get("speed", 1.0))
                a = [f"atrim=start={s['in']}:end={s['out']}", "asetpts=PTS-STARTPTS"]
                if sp != 1.0:
                    a.append(f"atempo={min(max(sp, 0.5), 2.0)}")
                chains.append(f"[{i}:a]{','.join(a)},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a{i}]")
            else:
                chains.append(f"anullsrc=r=48000:cl=stereo,atrim=duration={dur},asetpts=PTS-STARTPTS[a{i}]")
            a_labels.append(f"a{i}")
        chains.append(f"{''.join(f'[{l}]' for l in a_labels)}concat=n={len(a_labels)}:v=0:a=1[aorig]")
        aout = "aorig"

    if bgm:
        bgm_path = Path(bgm["path"]).expanduser()
        if not bgm_path.exists():
            fail(f"BGM 不存在: {bgm_path}")
        bgm_idx = len(segs)
        inputs += ["-i", str(bgm_path)]
        vol = float(bgm.get("volume", 0.85))
        fin = float(bgm.get("fade_in", 1.0))
        fout = float(bgm.get("fade_out", 1.5))
        ss = float(bgm.get("start", 0))
        chain = [f"atrim=start={ss}:duration={total}", "asetpts=PTS-STARTPTS",
                 f"volume={vol}"]
        if fin > 0:
            chain.append(f"afade=t=in:st=0:d={fin}")
        if fout > 0:
            chain.append(f"afade=t=out:st={max(0, total - fout):.3f}:d={fout}")
        chain.append("aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo")
        chains.append(f"[{bgm_idx}:a]{','.join(chain)}[bgm]")

        if aout:  # 原声 + BGM 混音，原声压低让人声可辨
            duck = float(bgm.get("original_volume", 1.0))
            chains.append(f"[{aout}]volume={duck}[aduck]")
            chains.append("[aduck][bgm]amix=inputs=2:duration=first:dropout_transition=0[amix]")
            aout = "amix"
        else:
            aout = "bgm"

    filtergraph = ";".join(chains)
    cmd = ["ffmpeg", "-nostdin", "-y", *inputs,
           "-filter_complex", filtergraph, "-map", f"[{vout}]"]
    if aout:
        cmd += ["-map", f"[{aout}]", "-c:a", "aac", "-b:a", "192k"]
    else:
        cmd += ["-an"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "19",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-t", f"{total:.3f}", str(out_path)]

    if args.dry_run:
        print(json.dumps({"duration": total, "resolution": [w, h], "fps": fps,
                          "look": look_name, "filtergraph": filtergraph},
                         ensure_ascii=False, indent=2))
        return

    out_path.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-3000:], file=sys.stderr)
        fail("ffmpeg 渲染失败")

    size_mb = round(out_path.stat().st_size / 1024 / 1024, 2)
    print(json.dumps({"output": str(out_path), "duration": total,
                      "resolution": [w, h], "fps": fps, "look": look_name,
                      "size_mb": size_mb, "segments": len(segs)},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
