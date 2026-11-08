#!/usr/bin/env python3
"""按固定间隔抽帧，供视觉模型逐帧判断内容与画质。

用法:
  extract_frames.py <video> <outdir> [--interval 1.5] [--max 8] [--width 640]

输出: 打印 JSON，含每帧的文件路径和它在原视频中的时间戳。
帧文件命名 <stem>__t<秒>.jpg，时间戳直接编码在文件名里，
这样视觉模型的结论可以无歧义地映射回时间轴。
"""

import argparse
import json
import subprocess
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("outdir")
    ap.add_argument("--interval", type=float, default=1.5)
    ap.add_argument("--max", type=int, default=8)
    ap.add_argument("--width", type=int, default=640)
    args = ap.parse_args()

    video = Path(args.video).expanduser()
    outdir = Path(args.outdir).expanduser()
    outdir.mkdir(parents=True, exist_ok=True)

    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(video)],
        capture_output=True, text=True, check=True).stdout.strip())

    # 避开首尾极端帧（常见黑场/手抖），在有效区间内均匀取点
    pad = min(0.3, dur * 0.05)
    start, end = pad, max(pad, dur - pad)
    span = max(0.0, end - start)

    count = min(args.max, max(1, int(span / args.interval) + 1))
    if count == 1:
        stamps = [round(start + span / 2, 2)]
    else:
        step = span / (count - 1)
        stamps = [round(start + i * step, 2) for i in range(count)]

    stem = video.stem
    frames = []
    for ts in stamps:
        out = outdir / f"{stem}__t{ts}.jpg"
        subprocess.run(
            ["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(ts), "-i", str(video),
             "-frames:v", "1", "-vf", f"scale={args.width}:-2", "-q:v", "3", str(out)],
            check=True)
        if out.exists():
            frames.append({"t": ts, "frame": str(out)})

    print(json.dumps({"video": str(video), "duration": round(dur, 2), "frames": frames},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
