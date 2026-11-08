#!/usr/bin/env python3
"""探测素材信息：时长、分辨率、帧率、是否有音轨、旋转角度。"""

import json
import subprocess
import sys
from pathlib import Path

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm", ".MP4", ".MOV"}


def probe(path):
    cmd = [
        "ffprobe", "-v", "error", "-print_format", "json",
        "-show_format", "-show_streams", str(path),
    ]
    out = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    data = json.loads(out)

    video = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    audio = next((s for s in data["streams"] if s["codec_type"] == "audio"), None)
    if video is None:
        return None

    rotation = 0
    for sd in video.get("side_data_list", []) or []:
        if "rotation" in sd:
            rotation = int(sd["rotation"])
    w, h = int(video["width"]), int(video["height"])
    if abs(rotation) in (90, 270):
        w, h = h, w

    fr = video.get("avg_frame_rate", "0/1")
    try:
        num, den = fr.split("/")
        fps = round(int(num) / int(den), 2) if int(den) else 0
    except ValueError:
        fps = 0

    return {
        "path": str(path),
        "name": Path(path).name,
        "duration": round(float(data["format"]["duration"]), 2),
        "width": w,
        "height": h,
        "orientation": "portrait" if h > w else ("square" if h == w else "landscape"),
        "fps": fps,
        "has_audio": audio is not None,
        "rotation": rotation,
    }


def main():
    if len(sys.argv) < 2:
        print("usage: probe.py <dir-or-files...>", file=sys.stderr)
        sys.exit(1)

    targets = []
    for arg in sys.argv[1:]:
        p = Path(arg).expanduser()
        if p.is_dir():
            targets += sorted(x for x in p.iterdir() if x.suffix in VIDEO_EXT)
        elif p.suffix in VIDEO_EXT:
            targets.append(p)

    clips = []
    for t in targets:
        try:
            info = probe(t)
            if info:
                clips.append(info)
        except subprocess.CalledProcessError:
            print(f"skip unreadable: {t}", file=sys.stderr)

    print(json.dumps({"clips": clips, "total_duration": round(sum(c["duration"] for c in clips), 2)},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
