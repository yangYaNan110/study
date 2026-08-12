uniform sampler2D modelColor;

varying vec2 vUv;

void main() {
    // 模型已在离屏目标中完成自身深度测试；这里仅按 alpha 覆盖 Mapbox 已有颜色。
    gl_FragColor = texture2D(modelColor, vUv);
}
