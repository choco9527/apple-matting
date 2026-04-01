# Apple Matting

[English README](./README.md)

[![Website](https://img.shields.io/badge/Website-matting.lingxiangtools.top-0f766e?style=flat-square)](https://matting.lingxiangtools.top/)
[![License: GPLv3](https://img.shields.io/badge/License-GPLv3-f59e0b?style=flat-square)](./LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%2014%2B-111827?style=flat-square)](https://matting.lingxiangtools.top/)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-24c8db?style=flat-square)](https://tauri.app/)
[![Vue](https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square)](https://vuejs.org/)

![Apple Matting Logo](./app_logo.png)

Apple Matting 是一个基于 `Tauri 2 + Vue 3 + Rust` 构建的本地桌面抠图工具，当前后端抠图能力依赖 macOS 原生能力实现，适合快速处理人物、商品、头像等图片背景。

官网：<https://matting.lingxiangtools.top/>

## 功能特性

- 单张图片抠图
- 批量扫描文件夹并批量抠图
- 支持 `JPG`、`PNG`、`WEBP`、`BMP`
- 抠图结果对比预览
- 支持透明底、纯色背景、渐变背景
- 内置结果编辑器，可二次擦除 / 还原
- 支持复制到剪贴板、另存为、打开结果所在位置
- 提供中英文界面

## 运行演示

仓库内附带运行视频：

- [查看运行视频 `images/oreater.mp4`](./images/oreater.mp4)

如果当前平台支持 HTML 视频预览，也可以直接播放：

<video src="./images/oreater.mp4" controls muted playsinline width="100%"></video>

## 技术栈

- 前端：`Vue 3`、`Vite`、`Element Plus`、`vue-i18n`
- 桌面端：`Tauri 2`
- 后端：`Rust`
- 平台能力：`Swift + macOS Vision / Core Image`

## 运行要求

- macOS 14.0 及以上
- Node.js 18+
- `pnpm`
- Rust 工具链
- Xcode Command Line Tools

说明：当前仓库中的抠图核心通过 `src-tauri/swift/MattingBridge.swift` 与 macOS 原生能力交互，非 macOS 平台会返回不支持错误。

## 快速开始

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm tauri dev
```

构建应用：

```bash
pnpm tauri build
```

生成图标：

```bash
pnpm tauri icon app_logo.png
```

## 项目结构

```text
.
├── src/                # Vue 前端界面
├── src-tauri/          # Tauri / Rust / Swift 原生能力
├── public/             # 静态资源
├── images/             # README 演示资源
├── app_logo.png        # 项目图标源文件
```

## 使用说明

### 单张抠图

1. 打开应用后进入“单张处理”
2. 点击、拖拽或粘贴图片
3. 执行抠图
4. 按需编辑结果、替换背景、复制或保存

### 批量抠图

1. 进入“批量处理”
2. 选择输入文件夹
3. 可选设置输出目录
4. 开始处理并查看进度
5. 处理完成后打开结果所在位置

## 许可说明

本项目采用 `GNU GPL v3.0`（`GPL-3.0-only`）许可发布。详细条款请查看 [LICENSE](./LICENSE)。

## 作者信息

- Author: `XIAOBIN`
- Email: `lxt@lingxiangtools.top`
- Website: `https://matting.lingxiangtools.top/`

## 贡献说明

欢迎提交 Issue 和 Pull Request，但提交代码即表示你同意：

- 你的贡献以本项目当前许可方式发布
- 你拥有提交内容的合法权利
