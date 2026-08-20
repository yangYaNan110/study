## 坐标流程

OBJ 局部 ENU（米）
→ ECEF 地心地固坐标（米）
→ LLA 经度、纬度、椭球高
→ Mapbox 归一化 Mercator
→ 相对模型锚点的 Mercator
→ 渲染时加回模型锚点
