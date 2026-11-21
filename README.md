# 张许可 · 个人作品集基础版

独立的 React + Vite 单页作品集。桌面布局以最大约 1700px 的内容宽度设计，包含图像 Hero、个人经历、精选作品、能力卡片和整屏联系方式。首页使用用户提供的「Vicky's Archive」主视觉，人物眼睛跟随鼠标，背景叠加 React Bits PatternWaves 交互波纹。GSAP opening 先以双行标题、遮罩和红色快门线进场，再揭示主视觉；章节标题、作品卡片、图片揭幕和轻微视差由 ScrollTrigger 编排。开场支持跳过，系统开启减少动态效果时会显示完整静态内容。

## 运行

在本目录打开 PowerShell：

```powershell
pnpm install
pnpm dev
```

浏览器打开 `http://localhost:5173/`。也可以在项目根目录双击 `预览Vite基础版.cmd`（首次运行前需安装依赖）。

生产构建：

```powershell
pnpm build
```

构建结果在 `dist/`，是可部署的静态网站。推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。

## 在线地址

- GitHub 仓库：<https://github.com/xkz9417-hub/portfolio>
- GitHub Pages：<https://xkz9417-hub.github.io/portfolio/>

## 修改入口

- `src/main.jsx`：个人介绍、经历、作品、能力和页面交互。
- `src/style.css`：配色、排版、布局与响应式样式。
- `src/reference-theme.css`：以原稿灰色网格、红色与金色为基础的页面配色。
- `src/components/PatternWaves.jsx`：来自 [React Bits Pattern Waves](https://reactbits.dev/backgrounds/pattern-waves) 的 JavaScript + CSS 波纹组件，依赖 `ogl`。
- `src/components/HeroEyes.jsx`：原稿人物的眼部跟随交互。
- `src/components/usePortfolioMotion.js`：GSAP 时间线、ScrollTrigger 章节编排和开场跳过逻辑。
- `src/motion.css`：opening、章节标题和图片揭幕的样式。
- `public/media/`：从现有简历及作品集中选取的照片、作品、视频和 PDF。

内容依据现有简历和作品集整理。项目详情目前使用简介弹窗，完整作品可通过 PDF 查看，后续可继续扩展为独立项目页。
