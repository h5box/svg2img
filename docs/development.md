# SVG 转 PNG 纯前端工具开发文档

## 1. 项目概述

本项目是一个基于 Vue 3 + Vite 的纯前端 SVG 转 PNG 工具。用户可以通过拖拽或点击上传 SVG 文件，在界面上预览并调整输出尺寸（宽度、高度、缩放比例），最后将转换后的 PNG 图片下载到本地。

**技术栈：**
-   **框架**: Vue 3 (Composition API)
-   **构建工具**: Vite
-   **样式**: Tailwind CSS (推荐用于快速构建现代 UI)
-   **图标**: Heroicons 或类似 SVG 图标库

## 2. UI/UX 设计规范

设计风格定位为 **现代极简主义 (Modern Minimalism)** 与 **微光玻璃拟态 (Subtle Glassmorphism)**，强调视觉通透感和操作直观性。

### 2.1 视觉语言
-   **背景**: 柔和的网格或极淡的渐变色背景 (`bg-slate-50`)。
-   **卡片**: 高透明度白色背景 + 背景模糊 (`backdrop-blur`) + 柔和阴影。
-   **主色调**: Indigo (`#6366F1`) 用于主要按钮和激活状态。
-   **字体**: 系统默认无衬线字体 (Inter, Roboto, system-ui)。

### 2.2 核心界面布局
采用 **单页应用 (SPA) 居中布局**。

1.  **头部 (Header)**:
    -   极简 Logo + 标题 "SVG to PNG Converter"。
    -   副标题 "Secure, local, and fast." (强调纯前端，无服务端上传)。

2.  **核心区域 (Main Workspace)**:
    -   **初始状态**: 一个巨大的拖拽上传区域 (DropZone)，虚线边框，中心大图标，文案 "拖拽 SVG 文件到这里"。
    -   **工作状态 (文件加载后)**:
        -   **左侧 (预览区)**: 透明度方格背景 (Checkerboard Pattern)，居中显示 SVG 预览图。
        -   **右侧 (控制面板)**: 玻璃拟态卡片。包含：
            -   尺寸设置: 宽度 (Width) / 高度 (Height) 输入框，带锁定比例开关。
            -   缩放倍率: 1x, 2x, 4x, Custom 快速选择。
            -   文件信息: 文件名，原始尺寸。
            -   操作栏: "下载 PNG" (主按钮)，"重置" (次要按钮)。

3.  **响应式适配**:
    -   移动端 (< 768px): 上下堆叠布局 (预览在上，控制在下)。
    -   桌面端 (> 768px): 左右分栏或居中卡片式布局。

## 3. 核心功能实现原理

### 3.1 文件读取
利用 HTML5 `Drag and Drop API` 和 `FileReader`。
-   监听 `drop` 事件获取 `File` 对象。
-   使用 `FileReader.readAsDataURL(file)` 将 SVG 读取为 Base64 字符串，用于 `<img>` 标签预览。
-   或者使用 `URL.createObjectURL(file)` 创建临时 URL。

### 3.2 SVG 渲染与转换
核心流程：**SVG String -> Image Object -> Canvas -> PNG DataURL**

1.  创建一个隐藏的 `Image` 对象。
2.  将 SVG 的 DataURL 赋值给 `image.src`。
3.  等待 `image.onload` 触发。
4.  创建一个离屏 `Canvas` (`document.createElement('canvas')`)。
5.  设置 Canvas 宽高为用户设定的目标尺寸（例如 `width * scale`）。
6.  使用 `ctx.drawImage(image, 0, 0, width, height)` 将图片绘制到 Canvas 上。
7.  使用 `canvas.toDataURL('image/png')` 获取 PNG 的 Base64 数据。

### 3.3 下载功能
1.  创建一个临时的 `<a>` 标签。
2.  设置 `href` 为生成的 PNG DataURL。
3.  设置 `download` 属性为文件名 (例如 `filename.png`)。
4.  触发点击事件 `a.click()`。
5.  移除临时标签。

## 4. 目录结构

```
src/
├── assets/          # 静态资源
├── components/      # 组件
│   ├── DropZone.vue       # 拖拽上传区域
│   ├── PreviewCanvas.vue  # 预览与渲染画布
│   ├── Controls.vue       # 设置面板
│   └── Header.vue         # 头部
├── composables/     # 组合式函数 (Logic)
│   ├── useSvgConverter.ts # 核心转换逻辑
│   └── useDragDrop.ts     # 拖拽逻辑
├── App.vue          # 主入口
├── main.ts          # 入口文件
└── style.css        # 全局样式 (Tailwind directives)
```

## 5. 开发步骤规划

1.  **初始化项目**: 使用 Vite 创建 Vue 3 + TypeScript 项目，安装 Tailwind CSS。
2.  **构建 UI 骨架**: 实现 Header, DropZone, 和基础布局。
3.  **实现文件上传**: 完成 `useDragDrop` 逻辑，能够读取 SVG 文件并在界面显示。
4.  **实现转换核心**: 完成 `useSvgConverter` 逻辑，实现 SVG -> Canvas -> PNG 的渲染链路。
5.  **完善控制面板**: 绑定宽、高、缩放比例的数据双向绑定，实时更新 Canvas 预览。
6.  **下载功能**: 实现下载按钮逻辑。
7.  **样式优化**: 应用玻璃拟态效果，优化动画和交互细节。
