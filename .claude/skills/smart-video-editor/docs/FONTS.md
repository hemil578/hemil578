# 本地字体库索引

位置：`~/.cola/assets/fonts/`
用途：视频标题动画 / ASS 字幕渲染。

**ASS / ffmpeg 用法**：`Fontname` 必须填下表的 **family name**（不是文件名）：

```bash
ffmpeg -i in.mp4 -vf "subtitles=title.ass:fontsdir=/Users/yunf/.cola/assets/fonts" out.mp4
```

下表所有 family name 都已实测在 libass 里正确命中（对照"不存在的字体名"的 fallback 渲染做过 md5 差异校验），不会静默回退到系统字体。

预览图：`PREVIEW.png`（每格渲染「骑行Ag8」）。

---

## 索引表

| 文件名 | family name（ass 里用的） | 风格描述 | 许可 | 适合场景 | 是否含中文 |
|---|---|---|---|---|---|
| `SmileySans-Oblique.ttf` | `Smiley Sans Oblique` | 得意黑。倾斜粗黑，字面紧、笔画有切角，张力极强，横向压缩显得凌厉 | SIL OFL 1.1 | 短视频大标题首选、运动/潮流/城市探索、需要冲击力的开场字卡 | ✅ 9440 字形 |
| `Alibaba-PuHuiTi-Bold.otf` | `Alibaba PuHuiTi B` | 阿里巴巴普惠体 Bold。方正现代黑体，字重饱满但不臃肿，字形规整中性 | 阿里巴巴免费商用授权（可商用，**不得再分发/改名/修改**） | 通用标题主力、口播字幕、需要"干净不出错"的商业向内容 | ✅ 28937 字形（全字符集） |
| `Alibaba-PuHuiTi-Heavy.otf` | `Alibaba PuHuiTi H` | 普惠体 Heavy。极粗黑，笔画间空隙很小，重量感强 | 同上 | 封面大字、数字/价格强调、需要压满画面的粗标题 | ✅ 8167 字形（常用字全覆盖） |
| `NotoSansSC-Bold.otf` | `Noto Sans SC` | 思源黑体 SC Bold。开源黑体标杆，中性、易读、无个性偏向 | SIL OFL 1.1 | 正文字幕、说明性文字、多语言混排的安全选择 | ✅ 30890 字形 |
| `NotoSansSC-Black.otf` | `Noto Sans SC Black` | 思源黑体 SC Black。最粗字重，厚重扎实，比 Bold 明显更压 | SIL OFL 1.1 | 标题黑底白字、需要粗但要求"不花哨"的场景、纯商用可再分发场景替代普惠体 | ✅ 30890 字形 |
| `NotoSerifSC-Bold.otf` | `Noto Serif SC` | 思源宋体 SC Bold。粗细对比明显的现代宋，横细竖粗，端庄有质感 | SIL OFL 1.1 | 文艺向标题、旅拍/人文纪录片、片头引言、需要"高级感"的场景 | ✅ 30928 字形 |
| `LXGWWenKai-Regular.ttf` | `LXGW WenKai` | 霞鹜文楷。楷体骨架 + 手写笔意，笔画起收有明显运笔感，柔和不锐利 | SIL OFL 1.1 | 文艺向首选、日记/vlog 旁白、散文式字幕、治愈系内容 | ✅ 46490 字形（覆盖最广） |
| `LXGWWenKaiMono-Regular.ttf` | `LXGW WenKai Mono` | 霞鹜文楷等宽版。西文/数字等宽，中文同文楷；纵向对齐整齐 | SIL OFL 1.1 | 需要逐字对齐的字幕动画（打字机效果）、代码/数据类字卡、时间轴标注 | ✅ 46510 字形 |
| `ChillRoundGothic_Bold.otf` | `Chill Round Gothic Bold` | 寒蝉圆黑体 Bold。粗圆体，笔画端头全圆角，可爱但不幼稚 | SIL OFL 1.1 | 生活化/轻松向标题、美食、萌宠、亲子、种草类 | ✅ 27148 字形 |
| `ZCOOLKuaiLe-Regular.ttf` | `ZCOOL KuaiLe` | 站酷快乐体。粗方块化笔画，几何切割感，字形歪斜跳跃，很"玩" | SIL OFL 1.1 | 综艺花字、搞笑/反转字卡、儿童向、需要活泼感的贴片 | ✅ 7053 字形（常用字覆盖） |
| `ZCOOLQingKeHuangYou-Regular.ttf` | `ZCOOL QingKe HuangYou` | 站酷庆科黄油体。中细字重，字形瘦长带复古装饰味，笔画收尾有小曲折 | SIL OFL 1.1 | 复古/胶片风标题、咖啡馆/文创、需要"有点旧"氛围的场景 | ✅ 9429 字形 |
| `MaShanZheng-Regular.ttf` | `Ma Shan Zheng` | 马善政毛笔楷书。真毛笔手写，笔画连带倾斜，行气流动，个性极强 | SIL OFL 1.1 | 书法感标题、节气/国风、题字式片头、单行短句（长文会难读） | ✅ 7015 字形（常用字覆盖） |
| `BebasNeue-Regular.ttf` | `Bebas Neue` | 高瘦压缩全大写无衬线，字宽极窄，纵向拉伸，无小写字母 | SIL OFL 1.1 | 英文标题、大号数字（日期/里程/时间码）、海报式竖排排版 | ❌ 仅拉丁 461 字形 |
| `PlayfairDisplay-VF.ttf` | `Playfair Display` | 高对比度衬线（Didone 风），细横粗竖，衬线锋利优雅 | SIL OFL 1.1 | 英文文艺标题、杂志风、时尚/旅行、与思源宋体中西混排 | ❌ 仅拉丁 659 字形 |
| `Inter-VF.ttf` | `Inter` | 现代 UI 无衬线，x-height 高、字腔开阔，小字号仍清晰；可变字重 100–900 | SIL OFL 1.1 | 英文正文/小字标注、UI 截图配字、数据标签、与思源黑体混排 | ❌ 仅拉丁/西里尔/希腊 2849 字形 |

---

## 快速选型

- **要冲击力** → `Smiley Sans Oblique`（倾斜）/ `Alibaba PuHuiTi H`（正）/ `Noto Sans SC Black`
- **要文艺** → `Noto Serif SC`（宋）/ `LXGW WenKai`（楷）/ `Ma Shan Zheng`（毛笔）
- **要轻松** → `Chill Round Gothic Bold`（圆）/ `ZCOOL KuaiLe`（跳）
- **要复古** → `ZCOOL QingKe HuangYou`
- **要稳妥不出错** → `Noto Sans SC` / `Alibaba PuHuiTi B`
- **中西混排推荐组合**：思源宋体 SC + Playfair Display；思源黑体 SC + Inter；普惠体 H + Bebas Neue

## 可变字体说明

`Inter-VF.ttf` 和 `PlayfairDisplay-VF.ttf` 是可变字体（VF）。libass 只会用默认实例（Regular / wght 400）。需要粗体时用 ASS 的 `Bold: -1` 让 libass 做合成加粗，或另行下载静态字重文件。

## 许可注意

- 除普惠体外全部为 **SIL OFL 1.1**：可商用、可嵌入视频、可再分发（保留版权声明，衍生字体不得用保留名称）。
- **阿里巴巴普惠体**：官方永久免费商用，但授权条款禁止再分发字体文件本身、禁止修改和改名。用在视频渲染输出上没问题；不要把 `.otf` 文件打包进对外分发的软件包。
- 得意黑（Smiley Sans）：OFL 1.1，商用无需授权。
