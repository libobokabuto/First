# DocKit — 产品需求文档 (PRD)

> **项目代号**: DocKit  
> **版本**: v1.0.0-MVP  
> **状态**: 起草中  
> **作者**: 用户需求驱动

---

## 1. 产品概述

### 1.1 产品定位

DocKit 是一款**跨端全能文档阅读编辑器**，覆盖手机（iOS/Android）和桌面（Windows/macOS/Linux）双端。核心定位是"文档界的 VLC"——一个 App 打开、阅读、编辑主流办公文档。

**开发策略**：手机 MVP 优先。先在手机端打磨 Markdown 编辑核心体验，再扩展到桌面端做全功能编辑器。

### 1.2 核心理念

- **手机端**：Markdown 所见即所得编辑（刚需），其他格式只读查看
- **桌面端**：全格式编辑能力，重度办公场景
- **共享核心**：格式解析器、数据模型、类型定义跨端复用

### 1.3 目标用户

- **学生/知识工作者**：手机上记笔记、写文档、查看各类文档
- **开发者**：移动端 Markdown 编辑，桌面端技术文档写作
- **普通用户**：偶尔需要查看或简单修改文档

---

## 2. 产品架构

### 2.1 Monorepo 结构

```
First/
├── package.json                    # 根 workspace
├── tsconfig.base.json              # 共享 TS 配置
├── packages/
│   ├── shared/                     # 🔗 跨端共享层
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── model/              # 统一数据模型 (DocumentModel)
│   │   │   ├── adapters/           # 格式解析适配器
│   │   │   │   ├── base.ts         # FormatAdapter 接口
│   │   │   │   ├── markdown.ts     # MD 解析 / 渲染
│   │   │   │   ├── docx.ts         # DOCX 只读解析
│   │   │   │   ├── pdf.ts          # PDF 只读解析
│   │   │   │   ├── xlsx.ts         # XLSX/CSV 只读解析
│   │   │   │   └── text.ts         # 纯文本
│   │   │   └── utils/              # 通用工具
│   │   └── __tests__/
│   │
│   ├── mobile/                     # 📱 手机端 (Expo / React Native)
│   │   ├── package.json
│   │   ├── app.json                # Expo 配置
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── screens/            # 页面
│   │   │   │   ├── EditorScreen    # MD 编辑器
│   │   │   │   ├── ViewerScreen    # 通用文档查看器
│   │   │   │   ├── FileBrowser     # 文件浏览
│   │   │   │   └── SettingsScreen  # 设置
│   │   │   ├── components/         # UI 组件
│   │   │   │   ├── WysiwygEditor   # 所见即所得编辑器
│   │   │   │   ├── MarkdownPreview # MD 预览
│   │   │   │   ├── Toolbar         # 格式工具栏
│   │   │   │   ├── DocViewer       # 通用文档渲染器
│   │   │   │   └── FileTree        # 文件树组件
│   │   │   ├── hooks/              # 自定义 hooks
│   │   │   ├── store/              # Zustand 状态
│   │   │   └── theme/              # 主题（暗色/亮色）
│   │   └── assets/
│   │
│   └── desktop/                    # 🖥️ 电脑端 (Electron + React + Vite)
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── main/               # Electron 主进程
│       │   ├── renderer/           # React UI
│       │   │   ├── App.tsx
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── hooks/
│       │   │   └── store/
│       │   └── preload/            # 预加载脚本
│       └── resources/
```

### 2.2 共享层架构

```typescript
// packages/shared/src/adapters/base.ts
interface FormatAdapter {
  readonly name: string;
  readonly extensions: string[];
  readonly canEdit: boolean;          // 是否支持编辑
  readonly canEditOnMobile: boolean;  // 手机端是否可编辑

  read(buffer: ArrayBuffer): Promise<DocumentModel>;
  write(model: DocumentModel): Promise<ArrayBuffer>;
  renderToHtml(model: DocumentModel): string;          // 输出 HTML，跨端通用
  renderToMarkdown?(model: DocumentModel): string;     // 反向转 MD
  getPreviewHtml?(model: DocumentModel): string;        // 纯预览用 HTML
}

// 统一文档模型
interface DocumentModel {
  format: string;
  title: string;
  content: any;         // 格式相关的结构化内容
  metadata: DocumentMeta;
}
```

---

## 3. 功能需求

### 3.1 手机端 MVP（Phase 1）

#### 模块 A：Markdown 所见即所得编辑器 🎯 核心

| 功能 | 优先级 | 说明 |
|---|---|---|
| **所见即所得编辑** | P0 | 默认渲染模式，直接看到格式效果 |
| **源码切换** | P0 | 点击进入编辑模式，显示原始 Markdown 源码 |
| **格式工具栏** | P0 | 加粗/斜体/标题/列表/引用/链接/图片/代码块 |
| **实时预览** | P0 | 编辑源码时旁边/下方实时渲染 |
| **GFM 支持** | P0 | 表格、任务列表、删除线、代码高亮 |
| **文件新建/打开/保存** | P0 | 本地 MD 文件管理 |
| **最近文件列表** | P1 | 快速打开最近编辑的文档 |
| **暗色/亮色主题** | P1 | 全局主题切换 |

#### 模块 B：其他格式只读查看

| 格式 | 优先级 | 说明 |
|---|---|---|
| 纯文本 (.txt) | P0 | 语法高亮 |
| PDF (.pdf) | P1 | 滚动查看，缩放 |
| Word (.docx) | P1 | 渲染为 HTML 查看 |
| Excel (.xlsx / .csv) | P1 | 表格视图 |
| PowerPoint (.pptx) | P2 | 幻灯片预览 |
| EPUB (.epub) | P2 | 电子书阅读 |

#### 模块 C：文件管理

| 功能 | 优先级 | 说明 |
|---|---|---|
| 本地文件浏览器 | P1 | 浏览手机存储中的文档 |
| 从其他 App 导入 | P2 | 分享菜单打开 |
| 文件搜索 | P2 | 按文件名搜索 |

### 3.2 桌面端（Phase 2+）

在手机 MVP 基础上扩展：

- **全格式编辑**：DOCX / PDF 批注 / XLSX / PPTX 编辑
- **标签页系统**：多文档同时打开
- **拖拽打开**：拖拽文件到窗口
- **系统文件关联**：设为默认打开程序
- **格式转换导出**：MD→PDF、DOCX→PDF 等
- **打印支持**
- **拼写检查**
- **插件系统**

---

## 4. 手机端编辑器交互设计

### 4.1 所见即所得模式（默认）

```
┌─────────────────────────────────┐
│  ← 返回        标题.md    🔧 ✕  │  顶部栏
├─────────────────────────────────┤
│  H1  H2  H3  B  I  S  🔗  📷  │  格式工具栏
├─────────────────────────────────┤
│                                 │
│  # 我的大标题                    │  渲染后的内容
│  **加粗文字**普通文字            │  直接看到格式效果
│                                 │
│  - 列表项 1                     │
│  - 列表项 2                     │
│                                 │
│  > 引用块                       │
│                                 │
├─────────────────────────────────┤
│  字数: 123  |  行: 10           │  底部状态栏
└─────────────────────────────────┘
```

### 4.2 源码编辑模式（点击编辑按钮切换）

```
┌─────────────────────────────────┐
│  ← 返回        编辑中        ✓  │  顶部栏（显示"编辑中"）
├─────────────────────────────────┤
│  # 我的大标题                    │
│                                 │
│  **加粗文字**普通文字             │  原始 Markdown 源码
│                                 │
│  - 列表项 1                     │
│  - 列表项 2                     │
│                                 │
│  > 引用块                       │
├─────────────────────────────────┤
│  [Markdown 语法高亮]             │  
│  字数: 123  |  行: 10           │
└─────────────────────────────────┘
```

- 默认进入文档 → 所见即所得渲染视图
- 点击编辑按钮（🔧）→ 进入源码编辑模式，键盘弹出，语法高亮
- 点击完成（✓）→ 退出编辑，回到渲染视图
- 两种模式下格式工具栏均可用

---

## 5. 技术方案

### 5.1 技术栈

| 层级 | 桌面端 | 手机端 | 共享 |
|---|---|---|---|
| **框架** | Electron + React 18 | Expo (React Native) | — |
| **语言** | TypeScript 5.x | TypeScript 5.x | TypeScript 5.x |
| **构建** | Vite | Expo CLI | tsc |
| **状态管理** | Zustand | Zustand | — |
| **Markdown 编辑** | CodeMirror 6 | expo-rich-editor / 自研 | react-markdown + remark-gfm |
| **Markdown 解析** | unified/remark | 同左 | unified + remark-gfm |
| **PDF 渲染** | pdfjs-dist | react-native-pdf | pdfjs-dist (解析) |
| **DOCX 解析** | mammoth.js | mammoth.js (同) | mammoth.js |
| **XLSX 解析** | SheetJS | SheetJS (同) | SheetJS |
| **包管理** | pnpm | pnpm | pnpm |
| **Monorepo** | — | — | pnpm workspaces |

### 5.2 手机端 MD 编辑器技术选型

核心难题：React Native 环境下 WYSIWYG Markdown 编辑器。

**推荐思路**：**混合模式**

1. **渲染态**（默认）：用 `react-native-webview` 内嵌 HTML 渲染 `@packages/shared` 输出的 HTML，配合 `remark-gfm` 完整支持 GFM
2. **编辑态**（点击编辑后）：使用 `TextInput` + 自定义键盘工具栏 + 语法高亮
3. **格式工具栏**：选中文本后点击工具栏按钮，自动插入对应 Markdown 语法

备选库（需进一步调研）：
- `react-native-pell-rich-editor`：富文本编辑，可尝试适配 Markdown 输出
- `expo-rich-editor`（实验性）
- `react-native-webview` + TipTap/ProseMirror（WebView 内嵌方案）

> MVP 阶段先用 **TextInput 源码编辑 + WebView 渲染预览** 方案，保证稳定性，后续迭代再做纯 WYSIWYG。

---

## 6. 开发路线图

### Phase 1：手机 MVP — Markdown 编辑（本次）

**目标**：跑通 Expo 架构，实现 MD 文档的阅读和源码编辑

- [x] 搭建 Monorepo（pnpm workspaces）
- [ ] 搭建 Expo 项目骨架（`packages/mobile`）
- [ ] 搭建 shared 包（`packages/shared`）— 类型定义 + MD 解析
- [ ] 文件浏览器 — 浏览本地 MD 文件
- [ ] MD 渲染预览（WebView + react-markdown）
- [ ] 源码编辑模式（TextInput + 语法高亮）
- [ ] 格式工具栏（快速插入 MD 语法）
- [ ] 所见即所得 / 源码模式切换
- [ ] 暗色/亮色主题
- [ ] 文件新建 / 保存 / 最近列表

### Phase 2：手机端 — 其他格式只读

- [ ] PDF 查看（react-native-pdf）
- [ ] DOCX 查看（mammoth.js → HTML 渲染）
- [ ] XLSX/CSV 表格查看（SheetJS）
- [ ] 通用文档查看器统一界面

### Phase 3：桌面端

- [ ] Electron + Vite + React 脚手架
- [ ] 标签页系统
- [ ] 全格式编辑器
- [ ] 拖拽打开 / 文件关联

### Phase 4：高级特性

- [ ] 格式转换导出
- [ ] PDF 批注
- [ ] 云存储集成

---

## 7. 非功能需求

### 7.1 性能

| 指标 | 手机端目标 |
|---|---|
| 冷启动时间 | < 1.5 秒 |
| MD 文件打开 | < 0.5 秒（1MB 以下） |
| 渲染/源码切换 | < 100ms |
| 内存占用 | 空闲 < 80MB |

### 7.2 平台

| 平台 | 优先级 |
|---|---|
| Android 8+ | P0 |
| iOS 15+ | P0 |
| Windows / macOS / Linux | P1 |

---

## 8. 手机 MVP 验收标准

- [ ] 能浏览、打开手机上的 `.md` 文件
- [ ] 打开后默认以渲染视图展示（所见即所得）
- [ ] 点击编辑按钮后进入源码编辑模式，支持 Markdown 语法高亮
- [ ] 点击完成后回到渲染视图
- [ ] 格式工具栏可快速插入：标题、加粗、斜体、列表、链接、图片、代码块
- [ ] 支持 GFM：表格、任务列表、删除线
- [ ] 能新建、保存 MD 文件
- [ ] 暗色/亮色主题可切换
- [ ] 最近打开文件列表

---
