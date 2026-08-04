import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // threeReact 位于 nextjs-blog 目录之外，需要允许 Next 编译该目录中的源码。
  experimental: {
    externalDir: true,
  },
  // Turbopack 默认根目录是 nextjs-blog；上提后才能跟踪同级 threeReact 的文件。
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
