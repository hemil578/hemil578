<div align="center">

# Smart Video Editor

**会看画面的 AI 剪辑 Skill**

不是把视频首尾相接，而是先看懂每一段拍了什么、哪几秒能用，再决定取舍、顺序、节奏、调色和配乐。

[English](./README.en.md) · 中文

</div>

---

## 这个 Skill 解决什么问题

你手机里存了 5 段旅行视频，想剪成一条能发小红书的成片。

**普通的 AI 剪辑工具会这样做**：读取文件名 → 按 1、2、3、4、5 顺序拼接 → 加个转场 → 套个滤镜 → 导出。它从头到尾不知道你拍的是什么。

结果就是：开头 2 秒手抖的糊画面留着，中间 8 秒对着同一棵树的重复镜头留着，最精彩的那 3 秒和废镜头一样长。

**这个 Skill 会这样做**：

```
抽帧 → 逐帧看懂内容 → 打可用性分 → 砍废片段 → 按叙事重排 → 调节奏 → 选调色 → 配乐 → 渲染
```

它知道第 3 段的前 4 秒是失焦的，知道第 1 段和第 4 段拍的是同一个场景（所以不能连着放），知道最后一段有人物出现（所以适合当收尾）。

---

## 智能体现在哪

### 1. 真的在"看"，不是在"猜"

每段素材按固定间隔抽帧，**每一帧都交给视觉模型判断**：

- 主体是什么、场景是什么、有没有人物
- 构图如何、有没有明确的视觉焦点
- 是否模糊、失焦、抖动、过曝、死黑、镜头遮挡、空镜、转场中间态
- 综合可用性打 1-5 分

帧文件名把时间戳编码进去（`clip1__t3.5.jpg`），所以视觉判断能**无歧义地映射回时间轴**——第 3.5 秒画面糊，就精确地从 3.5 秒开始砍。

### 2. 会做取舍，不是全都要

一段 15 秒的素材，如果 5-8.5 秒和 4.5 秒处几乎是同一个画面，它会直接砍掉——**画质满分但信息增量为零的片段，留着只是拖节奏**。

真实案例里，36.5 秒原素材最后只用了 18.8 秒，砍掉的都有明确理由。

### 3. 按叙事排序，不是按文件名

拿到全部画面信息后，它按内容逻辑重排：

| 叙事结构 | 排法 |
|---------|------|
| 空间叙事 | 全景开场 → 中景 → 细节特写 → 人物收尾 |
| 时间叙事 | 按事件发生顺序 |
| 情绪叙事 | 平静起 → 高潮 → 回落收尾 |

同一段素材可以被拆成多个片段插在不同位置，也可以整段丢弃。

### 4. 节奏和调色都是判断，不是默认值

**节奏**：短视频单段 1.5-3 秒，慢节奏 vlog 单段 4-6 秒。同类画面连续出现会自动缩短，避免观感重复。有 BGM 时切点尽量落在节拍上。

**调色**：9 种预设，根据画面内容选，不套默认值。

| 调性 | 适合 |
|------|------|
| `clean` | 通用，轻微提对比和锐度，最安全 |
| `film` | 电影感，中对比曲线 + 轻暗角 + 冷调阴影 |
| `warm` | 食物、室内、人物、日落 |
| `cool` | 城市、雪景、雨天、科技感 |
| `soft` | 日系清淡、柔和小清新 |
| `vivid` | 风景、明亮活泼、需要抓眼球 |
| `fresh` | **阴天/漫射光户外**，提通透但不染色，绿植类首选 |
| `bw` | 黑白 |
| `none` | 不调色 |

### 5. 自己找免费商用 BGM

不用你提供音乐。它会从 Pixabay Music、Free Music Archive（CC0）、Incompetech、Musopen 找，下载后验证是真音频，缓存到本地复用。

找不到就**先出无声版让你看到剪辑效果**，同时给出具体选曲指引：风格关键词（中英文）、BPM 区间（跟切点密度匹配）、情绪描述、时长要求、去哪找。你拿到音乐后只需重新渲染一次，不用重新分析素材。

**绝不从 YouTube / 网易云 / QQ 音乐抓有版权的商业音乐**——发到平台会被静音或限流。

### 6. 有设计感的片头标题

不用系统默认字体（一眼就是"没设计过"）。内置 15 个免费商用字体库，按画面调性选：

| 画面类型 | 字体方向 |
|---------|---------|
| 运动、骑行、city walk、潮流 | 得意黑（倾斜粗黑，有速度感） |
| 风景、旅行、治愈、慢生活 | 霞鹜文楷、思源宋体（文艺质感） |
| 产品、UI、数据、干货 | 思源黑体、Inter（干净克制） |
| 生活记录、日常、轻松 | 寒蝉圆黑、站酷快乐体（亲和力强） |
| 国风、节气、题字 | 马善政毛笔楷书 |
| 纯英文/数字 | Bebas Neue、Playfair Display |

7 种入场动画：`fade` / `fade-up` / `zoom-in` / `zoom-out` / `blur-in` / `typewriter` / `slide-left`

![字体预览](./docs/font-preview.png)

---

## 适合什么场景

### ✅ 很适合

| 场景 | 说明 |
|------|------|
| **小红书 / 抖音 / 视频号** | 竖屏成片，15-30 秒，自动配文艺标题和 BGM |
| **旅行 vlog** | 手机拍的零散片段，自动挑好镜头、按空间逻辑排序 |
| **朋友圈 / 微博** | 快速出一条不土的短片 |
| **产品演示** | 屏幕录制剪成节奏紧凑的功能展示 |
| **横屏素材转竖屏** | 自动判断主体位置，选裁切或模糊铺底 |
| **多段素材质量不齐** | 自动淘汰糊片、抖动、空镜 |

### ❌ 不适合

- **AI 生成视频** — 这是纯剪辑工具，不做文生视频
- **精确到帧的专业剪辑** — 抽帧间隔判断，帧级精度请用 Final Cut / Premiere
- **需要复杂特效/合成** — 只做基础调色、转场、变速
- **口播视频去语气词** — 不做 ASR
- **长视频（>5 分钟）** — 抽帧和视觉分析成本会明显上升

---

## 真实案例：城市里的绿色缝隙

> 5 段手机拍的骑行素材（共 36.5 秒）→ 一条 18.8 秒竖屏成片

![成片截图](./examples/cycling-greenway/storyboard.jpg)

### 素材情况

| 文件 | 时长 | 内容 |
|------|------|------|
| IMG_8071.mov | 4.62s | 林荫绿道第一视角推进 |
| IMG_8072.mov | 5.64s | 路边绿色金属围栏 |
| IMG_8074.mov | 7.10s | 绿道空镜，中后段出现行人 |
| IMG_8075.mov | 15.48s | 最长一段，穿过公园绿道 |
| IMG_8076.mov | 3.68s | 换机位，右侧有花丛前景 |

### 视觉分析结论（节选）

```
IMG_8071 | 2.31s | 汇聚线构图工整、中心对称，光线柔和  | 无缺陷      | 5/5
IMG_8072 | 3.66s | 围栏后一片树林，竖向线条杂乱无主体  | 网格视觉干扰 | 3/5
IMG_8074 | 6.80s | 行人背影居中，步道向消失点延伸      | 无           | 5/5
IMG_8075 | 6.68s | 内容与 4.55s 处近乎同帧同景        | 信息增量为零 | 5/5*
IMG_8076 | 3.50s | 两侧树木成天然画框，通透感最好      | 天空略过曝   | 5/5
```

\* 画质满分但内容重复，最终被砍

### 剪辑决策

| 顺序 | 素材 | 用了 | 为什么 |
|---|---|---|---|
| 1 | IMG_8075 | 0.3–3.2s | 全片最干净的引导线构图，当开场定场 |
| 2 | IMG_8071 | 1.8–4.62s | 均分最高（4.7/5），构图工整光线好 |
| 3 | IMG_8072 | 4.5–5.64s | 只留 1.1 秒当过渡，这段整体最弱 |
| 4 | IMG_8075 | 8.5–11.7s | 林荫加深，画面层次开始变丰富 |
| 5 | IMG_8075 | 12.6–15.4s | 树影光斑最多，视觉高潮 |
| 6 | IMG_8076 | 1.4–3.68s | 换机位，花丛前景，画面通透 |
| 7 | IMG_8074 | 3.4–7.1s | 远处有行人，唯一有主体的画面，收尾 |

**砍掉的**：
- IMG_8075 的 3.2–8.5s（5 秒）— 中段与前面同帧同景，纯拖节奏
- IMG_8072 的 0–4.5s — 拍的是围栏网格，视觉杂乱无主体
- IMG_8074 的 0–3.4s — 无主体空镜，前面已有足够空镜
- 各段开头 0–0.3s — 天空过曝

**叙事逻辑**：空镜开场 → 林荫渐深 → 光斑高潮 → 换机位提通透 → 有人出现收尾。整体是"进入 → 深入 → 遇见"的递进。

### 调色

阴天漫射光素材，`clean` 太灰撑不起来，`vivid` 过头（路面被染成蓝绿色、绿叶接近荧光）。最终用 `fresh`——提通透但不整体染色，锐化克制。

### 标题

![标题效果](./examples/cycling-greenway/title-frame.jpg)

- 文字：城市里的绿色缝隙
- 字体：**得意黑**（Smiley Sans Oblique）— 倾斜粗黑 + 斜切转角，对得上骑行的运动感
- 动画：`fade-up`，从下方升起，0.4s 出现 → 稳定 2.5s → 3.6s 消失
- 配色：暖白 `#FFF3E0` + 深棕描边 `#3D1F0C`（比纯白+纯黑柔和，跟绿道自然色调更搭）

### BGM

**LoFi Chill**（Pixabay，免费商用免署名，112 BPM）。112 BPM 对应 2-3 秒的切点密度正好。原声去掉了——骑行第一视角的风噪对短视频是干扰。

### 成片

[▶ demo.mp4](./examples/cycling-greenway/demo.mp4) · [完整 EDL](./examples/cycling-greenway/edl.json)

---

## 安装

### 前置依赖

```bash
# macOS
brew install ffmpeg

# 确认 ffmpeg 带 libass（标题功能需要）
ffmpeg -version | grep libass

# Python 依赖（仅字体名查询需要）
pip3 install fonttools
```

> **注意**：部分 ffmpeg 分发版不含 `ffprobe`。检查 `which ffprobe`，缺失的话从 [evermeet.cx](https://evermeet.cx/ffmpeg/) 单独下载。

### 安装 Skill

**Claude Code / Cola**

```bash
git clone https://github.com/Fagan1024/smart-video-editor.git
cp -R smart-video-editor ~/.claude/skills/     # Claude Code
cp -R smart-video-editor ~/.cola/skills/       # Cola
```

**OpenClaw**

```bash
npx clawhub install smart-video-editor
```

**其他兼容 Agent Skills 格式的工具**

```bash
npx skills add Fagan1024/smart-video-editor --global
```

### 字体库（可选，标题功能需要）

字体因体积原因不含在仓库里。[docs/FONTS.md](./docs/FONTS.md) 列出了全部 15 个字体的下载源和 family name。放到 `~/.cola/assets/fonts/` 即可。

---

## 怎么用

装好后直接说人话：

```
把这个文件夹里的视频剪一条小红书
```

```
这几段素材剪成 20 秒的 vlog，加个片头字"周末去了个新地方"
```

```
横屏的旅行视频转成竖屏，配点轻松的音乐
```

Agent 会自己走完：探测素材 → 抽帧 → 视觉分析 → 剪辑决策 → 找 BGM → 生成标题 → 渲染 → 交付时说明每段为什么这么剪。

### 手动调用（进阶）

```bash
# 1. 探测素材
python3 scripts/probe.py ~/Videos/raw/

# 2. 抽帧
python3 scripts/extract_frames.py ~/Videos/raw/clip1.mov /tmp/frames --interval 1.5 --max 8

# 3. 生成标题
python3 scripts/make_title.py \
  --text "城市里的绿色缝隙" --font "Smiley Sans Oblique" \
  --out title.ass --anim fade-up --size 142 \
  --color "#FFF3E0" --outline 1.7 --outline-color "#3D1F0C"

# 4. 校验 EDL
python3 scripts/build.py edl.json --dry-run

# 5. 渲染
python3 scripts/build.py edl.json
```

---

## EDL 结构

剪辑决策以 JSON 表达，人和 Agent 都能读写：

```json
{
  "output": "output/成片.mp4",
  "aspect": "9:16",
  "fps": 30,
  "look": "fresh",
  "fill_mode": "crop",
  "transition": { "type": "cut" },
  "keep_original_audio": false,
  "bgm": {
    "path": "assets/bgm/music.mp3",
    "volume": 0.9,
    "fade_in": 0.8,
    "fade_out": 1.8,
    "original_volume": 0.25
  },
  "title": {
    "ass": "title.ass",
    "fonts_dir": "~/.cola/assets/fonts"
  },
  "segments": [
    { "src": "raw/clip1.mov", "in": 0.3, "out": 3.2 },
    { "src": "raw/clip2.mov", "in": 1.8, "out": 4.6, "speed": 1.0 }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `aspect` | `9:16` `16:9` `1:1` `4:5` `3:4` |
| `resolution` | 可选 `[宽,高]`，给了就覆盖 aspect |
| `look` | 见上文调色表 |
| `fill_mode` | `crop` 裁满 / `pad` 黑边 / `blur_pad` 模糊铺底 |
| `transition.type` | `cut` `fade` `dissolve` `fadeblack` `wipeleft` `slideleft` `smoothleft` |
| `keep_original_audio` | 保留原声，和 BGM 同开会自动混音 |
| `segments[].in/out` | 该片段在源素材中的起止秒 |
| `segments[].speed` | `2.0` 快放一倍，`0.5` 慢放 |

**改一段重新渲染**：EDL 是纯文本，改完跑一次 `build.py` 就行，不用重新分析素材。

---

## 一个踩坑记录

开发时用视觉模型验证字体是否生效，结果它把霞鹜文楷判成"系统默认黑体，加载失败了"。

实际上字体是正常生效的——**视觉模型分不清楷体和黑体**。

libass 找不到字体名时会**静默 fallback 到系统默认字体，不报错**。要客观验证，得故意用一个不存在的字体名再渲一版当对照组，比 PSNR：

```bash
# PSNR 明显低于 inf（15-20dB 量级）= 两版画面不同 = 字体确实生效了
ffmpeg -y -i 待验证.png -i fallback对照.png -lavfi psnr -f null - 2>&1 \
  | grep -o "average:[0-9.]*"
```

这条已经写进 SKILL.md 了。

---

## 目录结构

```
smart-video-editor/
├── SKILL.md                        Agent 读取的指令文件
├── scripts/
│   ├── probe.py                    探测素材（时长/分辨率/朝向/音轨/旋转）
│   ├── extract_frames.py           抽帧，时间戳编码进文件名
│   ├── make_title.py               生成标题 ASS 字幕（7 种动画）
│   └── build.py                    按 EDL 渲染成片
├── examples/cycling-greenway/      真实案例：骑行绿道
│   ├── demo.mp4                    成片
│   ├── edl.json                    完整剪辑决策
│   ├── title.ass                   标题字幕
│   ├── storyboard.jpg              关键帧
│   └── title-frame.jpg             标题效果
└── docs/
    ├── FONTS.md                    15 个免费商用字体索引
    └── font-preview.png            字体预览图
```

---

## License

MIT

字体和 BGM 各自遵循其原始许可（详见 [docs/FONTS.md](./docs/FONTS.md)）。仓库本身不包含字体和音乐文件。
