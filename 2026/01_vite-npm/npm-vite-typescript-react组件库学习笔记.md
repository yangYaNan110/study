# npm、Vite、TypeScript 与 React 组件库开发学习笔记

> 学习项目：`01_npm-study` → `02_vite-study`（组件库）→ `03_react-test`（使用方）  
> 目标：编写 React 组件，通过 Vite 构建 JS、TypeScript 生成声明，制作 npm 安装包，并在另一个 React 项目中使用。

## 1. 一张表记住各工具的职责

| 工具 | 核心职责 | 主要配置 |
| --- | --- | --- |
| npm | 安装/管理依赖；运行 scripts；打包、发布 npm 包 | `package.json`、`package-lock.json` |
| Vite | 前端开发服务器、TS/TSX 转换、HMR、构建 JS 和资源 | `vite.config.ts` |
| TypeScript (`tsc`) | 类型检查；按配置编译 JS 或生成 `.d.ts` | `tsconfig.json`、`tsconfig.build.json` |
| React / React DOM | 定义 UI 组件和状态 / 渲染组件到浏览器 DOM | TSX 代码 |
| Rolldown | Vite 8 使用的底层生产构建打包器 | Vite 的 `build.rolldownOptions` |

**记忆口诀：npm 管包和调度，Vite 转换及打包，tsc 检查和声明，React 渲染 UI。**

```text
npm run build
  ├─ tsc --noEmit                   检查类型
  ├─ clean                          清空旧产物
  ├─ vite build                     输出 index.js（可带 .map）
  └─ tsc -p tsconfig.build.json     输出 index.d.ts 等

npm pack
  ├─ 自动触发 prepack → npm run build
  └─ 根据 files 等打包规则输出 .tgz
```

## 2. npm 入门

### 2.1 初始化与安装

```powershell
node -v
npm.cmd -v
npm.cmd init -y                 # 用默认值创建 package.json
npm.cmd install lodash          # dependencies
npm.cmd install -D vite         # devDependencies
npm.cmd ls --depth=0            # 查看直接安装的依赖
```

`package.json` 是**依赖声明与包元数据**，`package-lock.json` 记录具体解析版本与依赖树，`node_modules` 是实际安装文件。`npm install` 可调整锁文件；`npm ci` 要求锁文件与声明一致，清理后按锁文件安装，不修改这两个配置文件。

### 2.2 npm run 与 npx

```json
"scripts": { "dev": "vite", "typecheck": "tsc --noEmit" }
```

- `npm.cmd run dev`：读取 `scripts.dev`，执行 `vite`。
- `npx.cmd vite`：直接查找并执行 Vite 命令；未安装时可能提示下载。
- `npm.cmd run dev -- --port 3001`：`--` 是 npm 参数分隔符，后面参数传给脚本，等价于 `vite --port 3001`。
- scripts 里的 `tsc`、`vite` 可直接使用：npm 会把项目的 `node_modules/.bin` 加入查找路径。

**PowerShell 注意**：如果 `npm` 报 `npm.ps1` 被执行策略禁止，而 `npm.cmd` 正常，直接使用 `npm.cmd` 即可；这是 PowerShell 脚本策略，不是 npm 出错。

### 2.3 三种依赖

- `dependencies`：普通运行依赖。
- `devDependencies`：本地开发、构建、测试所需；如 Vite、TypeScript、concurrently。
- `peerDependencies`：声明使用方应提供的兼容依赖，如 React。npm 7+ 可能自动安装缺失 peer；**peer 不是“绝对不会安装”**。

React 组件库通常把 `react` 设为 **peer + dev**：开发时本地要有 React，使用时希望与宿主项目共享兼容的 React；还要在打包器中 external 排除 React。`peerDependencies` 和 `external` 不是一回事。

### 2.4 版本号和范围

`1.0.2` = Major.Minor.Patch（破坏兼容/兼容新增/兼容修复）。

| 声明 | 示例含义 |
| --- | --- |
| `"1.0.0"` | 精确等于 1.0.0 |
| `"^1.0.0"` | 允许 `>=1.0.0 <2.0.0` |
| `"~1.0.0"` | 允许 `>=1.0.0 <1.1.0` |

范围决定**允许**的版本，锁文件决定某次解析出的**具体**版本。注意 `^0.x` 的规则与 `^1.x` 不同。

```powershell
npm.cmd version patch --no-git-tag-version
npm.cmd version minor --no-git-tag-version
npm.cmd pkg get version
npm.cmd view lodash dist-tags --json
```

`latest` 是 Registry 的 dist-tag，不一定是数值上最大的版本。

## 3. Vite：开发服务器 vs 构建

- `vite`（通常由 `npm run dev` 调用）：启动开发服务器。Vite 按请求转换源码、使用浏览器 ES Modules，支持 HMR；部分依赖会预构建。
- `vite build`：生产构建，输出部署或分发产物。
- `vite preview`：**本地预览应用构建产物**，不应当作为生产服务器；纯库构建通常没有 HTML 可供 preview。

**默认应用构建**一般以根目录 `index.html` 为入口：

```text
index.html → src/main.tsx → App.tsx → dist/index.html + assets/*
```

在 `build.lib` 中指定 `entry` 才是明确启用 Vite 的 **Library Mode**；不是“只要写 build 就切换模式”。普通应用构建也可以另行配置入口。

### 3.1 Vite 配置示例（库模式）

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // React Fast Refresh 等开发支持；Vite 自身也能做基本 TSX 转换
  server: { port: 3000, open: true, strictPort: true },
  build: {
    outDir: 'my-dist',
    sourcemap: true,
    emptyOutDir: false, // 双 watch 共用输出目录时，避免 JS 构建清掉 .d.ts
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
    rolldownOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime']
    }
  }
});
```

- `build.lib`：Vite 的高级库构建封装；`entry` 是**源码入口**，`formats` 是输出模块格式，`fileName` 是基础文件名。
- `build.rolldownOptions`：传给底层 Rolldown 的配置；如 `external` 禁止把 React 实现合并进产物，保留外部模块引用。
- 旧教程可能写 `rollupOptions`：Vite 8 中优先使用 `rolldownOptions`。
- `lib` 并不等于 Rolldown 配置的同名属性；底层对应概念包括 `input`、`output.format`、`output.entryFileNames`，但仅手动配置这些不等于完整启用库模式。
- 若 `package.json` 有 `"type":"module"`，库的 ESM 输出常为 `index.js`；若没有，Vite 会按库模式的兼容规则可能输出 `index.mjs`。**始终以实际产物为准**。

### 3.2 React Fast Refresh

Vite 开发时将 `.tsx` 转成浏览器可执行的 JS。`@vitejs/plugin-react` 提供 React Fast Refresh：修改组件时在条件允许的情况下**保留 `useState` 等状态**。它不是所有改动都保证状态不丢；Hooks 结构变化等可能使状态重置。

### 3.3 Source Map 为什么能定位到源码？

生产 JS 文件末尾可有：

```js
//# sourceMappingURL=index.js.map
```

DevTools 根据映射文件里的 `sources`、`sourcesContent`、`mappings` 把**执行的构建后 JS 位置**对应回 `main.tsx` / `App.tsx`。浏览器实际运行的仍是 JS，并非 TSX；DevTools 获取 map 的请求不一定显示为普通页面 Network 请求。

## 4. TypeScript：检查和产物分别配置

`tsconfig.json` 用于日常类型检查，示意：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

```powershell
npx.cmd tsc --noEmit   # 检查类型，不输出文件
```

**重点**：Vite 转换 TS/TSX，不代表它已经做了完整 TypeScript 类型检查。

组件库还需要 `.d.ts` 给使用者提供类型信息，单独创建 `tsconfig.build.json`：

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "./my-dist",
    "rootDir": "./src"
  },
  "include": [
    "src/index.ts",
    "src/components/**/*.ts",
    "src/components/**/*.tsx"
  ],
  "exclude": ["node_modules", "my-dist"]
}
```

```powershell
npx.cmd tsc -p tsconfig.build.json
```

`declaration: true` 生成声明；`emitDeclarationOnly: true` 只生成类型声明，不输出 JS。

## 5. 三种不同的「入口」，不要混淆

组件库中：

```ts
// src/index.ts：源码公共 API
export { MyButton } from './components/MyButton';
```

```text
Vite build.lib.entry = src/index.ts      ← 给构建器看的源码入口
my-dist/index.js                         ← 构建出的运行文件
package.json exports                     ← 给使用者的模块解析器看的公开入口
```

`export { MyButton }` 决定**文件导出什么**；`package.json.exports` 决定**通过包名要找到哪个文件**。

```json
{
  "name": "my-react-ui-study",
  "version": "1.1.0",
  "type": "module",
  "main": "./my-dist/index.js",
  "exports": {
    ".": {
      "types": "./my-dist/index.d.ts",
      "import": "./my-dist/index.js"
    }
  },
  "files": ["my-dist"],
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

上面仅展示核心字段，**不是完整替换现有 package.json 的模板**。

- `exports["."].import`：ESM 运行入口。
- `exports["."].types`：显式类型入口。TS 使用合适的模块解析规则时，可能按同目录同名规则由 `index.js` 自动查找 `index.d.ts`；显式写 types 更清晰。
- 顶层 `types` 可额外用于兼容旧工具，现代项目不一定非要顶层和 `exports.types` 写两遍。
- `main` 是传统入口，有 `exports` 时现代 Node 一般优先 `exports`。
- `files`：在 `npm pack` / `npm publish` 时筛选打包内容，**不是包安装后解析 JS 的规则**。必要元数据 `package.json` 仍会进入压缩包。
- `npm run` 本身不检查 `exports` 是否可用；但它运行的程序若导入包，会触发模块解析，间接读取 `exports`。

### 5.1 类型声明的意义

`my-dist/index.js` 能运行但不含 TS 类型。若缺 `.d.ts`，TS 可能警告“找不到声明文件，隐式 any”；有声明后，`<MyButton title={123} />` 会针对 `title: string` 报错。不要用 `declare module 'my-react-ui-study'` 来随意抹掉类型检查。

## 6. 完整脚本配置：构建、监听、打包

```json
"scripts": {
  "dev": "vite",
  "dev:js": "vite build --watch",
  "dev:types": "tsc -p tsconfig.build.json --watch",
  "dev:lib": "concurrently -k \"npm:dev:js\" \"npm:dev:types\"",
  "clean": "node -e \"require('node:fs').rmSync('my-dist', { recursive: true, force: true })\"",
  "typecheck": "tsc --noEmit",
  "build:js": "vite build",
  "build:types": "tsc -p tsconfig.build.json",
  "build": "npm run typecheck && npm run clean && npm run build:js && npm run build:types",
  "prepack": "npm run build",
  "preview": "vite preview"
}
```

- `&&`：前一步成功才执行下一步；watch 会持续运行，不能靠 `&&` 顺序启动两个监听。
- `concurrently`：同时运行两个 watch，`-k` 在一个进程结束时关闭其他进程；需先 `npm.cmd install -D concurrently`。
- 开发时 `npm.cmd run dev:lib`：JS 与声明持续更新。
- 正式 `npm.cmd run build`：先类型检查、清理旧目录，然后构建 JS 与声明。
- `npm.cmd pack --foreground-scripts`：执行 `prepack` 自动触发 build，然后产生 `.tgz`，并显示详细生命周期日志。
- `npm.cmd pack --dry-run`：预览文件清单，不实际生成新 `.tgz`。

**避免冲突**：正式构建/pack 前停止 `dev:lib`，否则 watch 和 clean 会同时写/删目录。`emptyOutDir:false` 防止 Vite 删除类型产物，但平时可能留旧文件，所以正式构建先 clean。

## 7. 本地安装与 npm link

### 7.1 从 .tgz 安装：独立副本

```powershell
# 在 02_vite-study
npm.cmd pack

# 在 03_react-test
npm.cmd install ..\02_vite-study\my-react-ui-study-1.0.2.tgz
```

安装后使用方 `node_modules` 是独立文件。改源代码后需要重新构建、pack 和安装（通常升级版本号更清晰）。

### 7.2 npm link：符号链接/目录连接

```powershell
# 在 02_vite-study
npm.cmd link

# 在 03_react-test
npm.cmd link my-react-ui-study
Get-Item .\node_modules\my-react-ui-study | Format-List Name,LinkType,Target
```

在 Windows 上可能显示 `LinkType: Junction`，`Target` 指向 `02_vite-study`；这表示使用方读取的是组件库目录，不需要反复 pack/install。**链接不是自动编译器**，仍需 watch 更新 `my-dist`。

如果 `npm ls` 提示 `invalid: "file:../02_vite-study/...tgz"`，通常是 `package.json` 中仍声明旧 tgz，而实际指向目录链接。选择统一依赖方式：目录依赖 `"my-react-ui-study":"file:../02_vite-study"` 并 `npm install`，或采用纯 `npm link` 流程，不要混用旧声明。

React 本地链接若出现两份 React/Hooks 错误，在 **使用方** Vite 配置中可考虑：

```ts
resolve: { dedupe: ['react', 'react-dom'] }
```

Vite 预构建缓存导致使用方不更新时，先刷新，必要时重启：

```powershell
npm.cmd run dev -- --force
```

## 8. package.json 不能写注释怎么办？

JSON 不允许 `//` 和 `/* ... */`，强行写可能导致 npm 解析失败。

- 简单笔记可用自定义 `_notes` 字段，但它是普通 JSON 数据，可能随包一起发布。
- 更推荐将详解保存在 `package-notes.md` / `README.md`，让 `package.json` 保持简洁。
- `vite.config.ts` 是 TS 文件，可以正常写注释。
- 不要把 `package.json` 强行当 JSONC 使用；编辑器忽略错误不意味着 npm 支持注释。

## 9. 常用速查命令

```powershell
# 基础
npm.cmd init -y
npm.cmd install
npm.cmd ci
npm.cmd ls --depth=0
npm.cmd pkg get version

# Vite + TypeScript
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev:lib
npx.cmd tsc --noEmit

# npm 包制作与安装
npm.cmd pack --dry-run
npm.cmd pack --foreground-scripts
npm.cmd version patch --no-git-tag-version
npm.cmd install ..\02_vite-study\my-react-ui-study-1.0.2.tgz

# 本地联调
npm.cmd link
npm.cmd link my-react-ui-study
npm.cmd run dev -- --force

# 查询仓库（不安装）
npm.cmd view lodash version
npm.cmd view lodash versions --json
npm.cmd view lodash dist-tags --json
```

## 10. 十个容易忘记的结论

1. `npm run` 读 `scripts`；`npx` 直接找可执行程序。
2. `--` 是 npm 脚本参数分隔符，例如 `npm run dev -- --port 3001`。
3. Vite 应用构建通常入口是 `index.html`；`build.lib.entry` 指定组件库源码入口。
4. `plugins: [react()]` 的重要价值是 React Fast Refresh，而不只是 TSX 转换。
5. 浏览器运行的是 JS，DevTools 使用 Source Map 映射回源码。
6. Vite 能转换 TSX，但不替代完整的 `tsc` 类型检查。
7. `.d.ts` 给使用方类型信息，不包含运行实现。
8. `build.lib` 决定**从哪里构建**；`files` 决定**安装包带哪些文件**；`exports` 决定**使用者如何找入口**。
9. `external` 控制 JS 是否打入依赖；`peerDependencies` 声明宿主兼容依赖版本。
10. `.tgz` 是安装副本；`npm link` 是链接本地目录；`prepack` 让打包前自动构建。

---

> 推荐复习路线：第 1 节（职责）→ 第 5 节（三种入口）→ 第 6 节（完整脚本）→ 第 7 节（本地安装/联调）。
