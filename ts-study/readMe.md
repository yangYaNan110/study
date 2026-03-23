# 学习ts

## 第一步：搭建最小 TS + class-transformer 环境
在一个空目录执行：
```bash
npm init -y
npm install typescript ts-node class-transformer reflect-metadata
npx tsc --init

 "dev": "ts-node ./src/index.ts",      // 开发直接运行
    "build": "tsc",                      // 编译生产代码
    "start": "node ./dist/index.js"        // 运行编译后代码
```