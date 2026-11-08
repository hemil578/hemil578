#!/usr/bin/env python3
"""生成标题动画的 ASS 字幕文件。

用 ASS 而不是 drawtext，因为 ASS 能做逐字延迟、缩放、位移、透明度渐变，
且中文排版（字距、基线）由 libass 处理，比 drawtext 可靠。

用法:
  make_title.py --text "标题" --font "Smiley Sans" --out title.ass \
      [--start 0.4] [--duration 2.6] [--anim fade-up] [--size 96] ...
"""

import argparse
import json
from pathlib import Path

# 画布基准：按 1080x1920 设计，渲染时 libass 会自动缩放到实际分辨率
CANVAS_W, CANVAS_H = 1080, 1920

ANIMS = ("fade", "fade-up", "zoom-in", "zoom-out", "blur-in", "typewriter", "slide-left")


def cs(t):
    """秒 -> ASS 时间码 h:mm:ss.cc"""
    t = max(0.0, t)
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def ass_color(hexstr, alpha=0):
    """#RRGGBB -> ASS &HAABBGGRR&"""
    h = hexstr.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alpha:02X}{b}{g}{r}".upper() + "&"


def build_events(a):
    """返回 ASS Dialogue 行列表。"""
    fi = a.fade_in
    fo = a.fade_out
    total = a.duration
    end = a.start + total

    # 主标题的位置（ASS \pos 是文字锚点，Style 里 alignment=5 表示居中对齐）
    cx = CANVAS_W // 2
    cy = int(CANVAS_H * a.y)

    events = []

    def add(start, end, text, style="Title"):
        events.append(f"Dialogue: 0,{cs(start)},{cs(end)},{style},,0,0,0,,{text}")

    if a.anim == "typewriter":
        # 逐字出现：每个字一个事件，前面的字持续到结尾
        chars = list(a.text)
        per = a.stagger
        for i, _ in enumerate(chars):
            shown = "".join(chars[: i + 1])
            seg_start = a.start + i * per
            seg_end = a.start + (i + 1) * per if i < len(chars) - 1 else end
            tag = f"{{\\pos({cx},{cy})"
            if i == 0:
                tag += f"\\fad({int(fi*1000)},0)"
            if i == len(chars) - 1:
                tag = f"{{\\pos({cx},{cy})\\fad(0,{int(fo*1000)})"
            tag += "}"
            add(seg_start, seg_end, tag + shown)
        return events

    # 其余动画：单个事件 + \t() 时间变换
    tags = [f"\\pos({cx},{cy})"]

    if a.anim == "fade":
        tags.append(f"\\fad({int(fi*1000)},{int(fo*1000)})")

    elif a.anim == "fade-up":
        # 从下方 60px 升入 + 淡入淡出
        tags = [f"\\move({cx},{cy+60},{cx},{cy},0,{int(fi*1000)})",
                f"\\fad({int(fi*1000)},{int(fo*1000)})"]

    elif a.anim == "zoom-in":
        # 从 88% 放大到 100%，带轻微过冲的收束感
        tags += [f"\\fad({int(fi*1000)},{int(fo*1000)})",
                 "\\fscx88\\fscy88",
                 f"\\t(0,{int(fi*1000*1.4)},\\fscx100\\fscy100)"]

    elif a.anim == "zoom-out":
        tags += [f"\\fad({int(fi*1000)},{int(fo*1000)})",
                 "\\fscx112\\fscy112",
                 f"\\t(0,{int(fi*1000*1.4)},\\fscx100\\fscy100)"]

    elif a.anim == "blur-in":
        # 从模糊到清晰，同时轻微放大——最柔和的入场
        tags += [f"\\fad({int(fi*1000)},{int(fo*1000)})",
                 "\\blur12\\fscx94\\fscy94",
                 f"\\t(0,{int(fi*1000*1.6)},\\blur0\\fscx100\\fscy100)"]

    elif a.anim == "slide-left":
        tags = [f"\\move({cx+120},{cy},{cx},{cy},0,{int(fi*1000)})",
                f"\\fad({int(fi*1000)},{int(fo*1000)})"]

    add(a.start, end, "{" + "".join(tags) + "}" + a.text)

    # 副标题：主标题稳定后出现，同样淡出
    if a.subtitle:
        sy = cy + int(a.size * 1.05)
        s_start = a.start + a.sub_delay
        stags = [f"\\pos({cx},{sy})", f"\\fad({int(fi*1000*0.8)},{int(fo*1000)})"]
        if a.anim in ("fade-up", "blur-in"):
            stags = [f"\\move({cx},{sy+24},{cx},{sy},0,{int(fi*800)})",
                     f"\\fad({int(fi*1000*0.8)},{int(fo*1000)})"]
        add(s_start, end, "{" + "".join(stags) + "}" + a.subtitle, style="Sub")

    return events


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--text", required=True, help="主标题文字，用 \\N 换行")
    p.add_argument("--subtitle", default="", help="副标题（可选）")
    p.add_argument("--font", required=True, help="字体 family name（不是文件名）")
    p.add_argument("--sub-font", default="", help="副标题字体，默认同主标题")
    p.add_argument("--out", required=True)

    p.add_argument("--start", type=float, default=0.4, help="标题出现时间")
    p.add_argument("--duration", type=float, default=2.6, help="标题总停留时长")
    p.add_argument("--fade-in", type=float, default=0.5)
    p.add_argument("--fade-out", type=float, default=0.7)
    p.add_argument("--anim", default="fade-up", choices=ANIMS)
    p.add_argument("--stagger", type=float, default=0.12, help="typewriter 每字间隔")
    p.add_argument("--sub-delay", type=float, default=0.45, help="副标题延迟出现")

    p.add_argument("--size", type=int, default=96, help="主标题字号（1080 宽基准）")
    p.add_argument("--sub-size", type=int, default=0, help="副标题字号，0=主标题的 42%%")
    p.add_argument("--color", default="#FFFFFF")
    p.add_argument("--sub-color", default="")
    p.add_argument("--y", type=float, default=0.42, help="垂直位置比例 0-1")
    p.add_argument("--spacing", type=float, default=2, help="字距")
    p.add_argument("--bold", type=int, default=1, choices=(0, 1))

    # 可读性处理：视频上放白字必须有描边或阴影，否则遇到亮背景就糊了
    p.add_argument("--outline", type=float, default=0, help="描边粗细，0=不用")
    p.add_argument("--outline-color", default="#000000")
    p.add_argument("--shadow", type=float, default=1.5, help="阴影偏移")
    p.add_argument("--shadow-color", default="#000000")
    p.add_argument("--shadow-alpha", type=int, default=140, help="阴影透明度 0-255")
    # 复杂背景（树影、明暗交替）上，描边不够时用底板彻底切断干扰
    p.add_argument("--backdrop", type=float, default=0,
                   help="文字底板不透明度 0-1，0=不用。复杂背景上推荐 0.28-0.4")
    p.add_argument("--backdrop-color", default="#000000")

    a = p.parse_args()

    sub_size = a.sub_size or int(a.size * 0.42)
    sub_color = a.sub_color or a.color
    sub_font = a.sub_font or a.font

    # BorderStyle 4 = 文字后带底板（libass 扩展），Outline 值当内边距用
    if a.backdrop > 0:
        bd_alpha = int((1 - a.backdrop) * 255)
        border_style = 4
        back_colour = ass_color(a.backdrop_color, bd_alpha)
        outline_val = max(a.outline, 12)
    else:
        border_style = 1
        back_colour = ass_color(a.shadow_color, a.shadow_alpha)
        outline_val = a.outline

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {CANVAS_W}
PlayResY: {CANVAS_H}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,{a.font},{a.size},{ass_color(a.color)},{ass_color(a.color)},{ass_color(a.outline_color)},{back_colour},{-1 if a.bold else 0},0,0,0,100,100,{a.spacing},0,{border_style},{outline_val},{a.shadow},5,40,40,40,1
Style: Sub,{sub_font},{sub_size},{ass_color(sub_color)},{ass_color(sub_color)},{ass_color(a.outline_color)},{back_colour},0,0,0,0,100,100,{max(a.spacing, 3)},0,{border_style},{outline_val if a.backdrop > 0 else max(0, a.outline * 0.6)},{a.shadow},5,40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = build_events(a)
    out = Path(a.out).expanduser()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(header + "\n".join(events) + "\n", encoding="utf-8")

    print(json.dumps({
        "ass": str(out), "text": a.text, "font": a.font, "anim": a.anim,
        "visible": [a.start, round(a.start + a.duration, 2)],
        "events": len(events),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
