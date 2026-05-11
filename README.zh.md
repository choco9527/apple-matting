<p align="center">
  <img src="./app_logo.png" alt="Apple Matting Logo" width="160" />
</p>
<h1 align="center">Apple Matting</h1>
<p align="center">基于 Tauri、Vue 和 Rust 构建的 macOS 本地桌面抠图工具。</p>
<p align="center">
  <a href="./README.md">English README</a>
</p>
<p align="center">
  <a href="https://github.com/pangxiaobin/apple-matting/releases">
    <img src="https://img.shields.io/badge/Download-Releases-111827?style=for-the-badge&logo=github" alt="Release 下载" />
  </a>
  <a href="https://matting.lingxiangtools.top/#download">
    <img src="https://img.shields.io/badge/Download-Website-0f766e?style=for-the-badge&logo=safari" alt="官网下载" />
  </a>
</p>
<p align="center">
  <a href="https://matting.lingxiangtools.top/">
    <img src="https://img.shields.io/badge/Website-matting.lingxiangtools.top-0f766e?style=flat-square" alt="Website" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-GPLv3-f59e0b?style=flat-square" alt="License: GPLv3" />
  </a>
  <a href="https://matting.lingxiangtools.top/">
    <img src="https://img.shields.io/badge/Platform-macOS%2014%2B-111827?style=flat-square" alt="Platform" />
  </a>
  <a href="https://tauri.app/">
    <img src="https://img.shields.io/badge/Tauri-2.x-24c8db?style=flat-square" alt="Tauri" />
  </a>
  <a href="https://vuejs.org/">
    <img src="https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square" alt="Vue" />
  </a>
</p>

Apple Matting 是一个基于 `Tauri 2 + Vue 3 + Rust` 构建的本地桌面抠图工具，当前后端抠图能力依赖 macOS 原生能力实现，适合快速处理人物、商品、头像等图片背景。同时项目提供 `apple-matting-cli` 命令行能力，方便在终端、脚本和本地自动化流程中直接调用单张图片抠图。

官网：<https://matting.lingxiangtools.top/>

## 功能特性

- 单张图片抠图
- 批量扫描文件夹并批量抠图
- 支持 `JPG`、`PNG`、`WEBP`、`BMP`
- 抠图结果对比预览
- 支持透明底、纯色背景、渐变背景
- 内置结果编辑器，可二次擦除 / 还原
- 支持复制到剪贴板、另存为、打开结果所在位置
- 可选 `apple-matting-cli` 命令行能力，适合本地自动化调用
- 提供中英文界面

## 运行演示

![Apple Matting Demo](./images/operate.gif)

## 操作截图

<p align="center">
  <img src="./images/01.webp" alt="Apple Matting screenshot 01" width="48%" />
  <img src="./images/02.webp" alt="Apple Matting screenshot 02" width="48%" />
</p>
<p align="center">
  <img src="./images/02-1.webp" alt="Apple Matting screenshot 03" width="48%" />
  <img src="./images/03.webp" alt="Apple Matting screenshot 04" width="48%" />
</p>
<p align="center">
  <img src="./images/04.webp" alt="Apple Matting screenshot 05" width="72%" />
</p>

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

构建 CLI：

```bash
cd src-tauri
cargo build --release --bin apple-matting-cli
```

可选：注册到命令行：

```bash
ln -s "$(pwd)/target/release/apple-matting-cli" /usr/local/bin/apple-matting-cli
apple-matting-cli --help
```

生成图标：

```bash
pnpm tauri icon app_logo.png
```

## 注意事项

如果下载后 macOS 提示 `apple-matting.app`“文件已损坏”，可执行以下命令移除隔离属性后再重新打开：

```bash
xattr -rd com.apple.quarantine /Applications/apple-matting.app
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

### 命令行 CLI

构建并注册 CLI 后，可以在任意终端中处理单张图片：

```bash
apple-matting-cli input.jpg -o output.png
```

支持以下形式：

```bash
apple-matting-cli input.jpg
apple-matting-cli input.jpg output.png
apple-matting-cli input.jpg -o output.png
apple-matting-cli input.jpg --output output.png
```

只传入输入路径时，CLI 会在原图同级目录输出类似 `input_nobg.png` 的文件。CLI 是一次性本地命令：启动后处理图片、写出透明 PNG、打印输出路径，然后退出。

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

## 友情社区

- [linux.do](https://linux.do)

## Star History

<a href="https://www.star-history.com/?repos=pangxiaobin%2Fapple-matting&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=pangxiaobin/apple-matting&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=pangxiaobin/apple-matting&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=pangxiaobin/apple-matting&type=date&legend=top-left" />
 </picture>
</a>
