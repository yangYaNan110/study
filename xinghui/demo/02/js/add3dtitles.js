import * as THREE from 'three';
import { TilesRenderer } from '../node_modules/3d-tiles-renderer/build/index.three.js';

const TILESET_URL = new URL(
    '../../01/落汤鸡/目标三维模型-精模/output_tileset/tileset.json',
    import.meta.url
).href;

// tileset 根包围盒中心，坐标为 ECEF（米）。
const TILESET_ECEF_ORIGIN = new THREE.Vector3(
    -495372.9686669922,
    -4786469.613477539,
    4172609.178808594
);

// 与 addTargetModel 的 modelCenterParams.z 一样，作为模型的附加海拔（米）。
const TILESET_HEIGHT_OFFSET_METERS = 150;

/** 将 ECEF 米坐标转换为 [经度, 纬度, 海拔]。 */
function ecefToLla(x, y, z) {
    const a = 6378137.0;
    const b = 6356752.314245;
    const e2 = 1 - (b * b) / (a * a);
    const ep2 = (a * a - b * b) / (b * b);
    const p = Math.hypot(x, y);
    const theta = Math.atan2(z * a, p * b);
    const longitude = Math.atan2(y, x);
    const latitude = Math.atan2(
        z + ep2 * b * Math.sin(theta) ** 3,
        p - e2 * a * Math.cos(theta) ** 3
    );
    const radius = a / Math.sqrt(1 - e2 * Math.sin(latitude) ** 2);
    const altitude = p / Math.cos(latitude) - radius;

    return [longitude * 180 / Math.PI, latitude * 180 / Math.PI, altitude];
}

/** 创建 Mercator 局部坐标的根节点；子模型的顶点会在加载时转换到这个局部坐标系。 */
function createTilesMercatorFrame() {
    const [longitude, latitude, altitude] = ecefToLla(
        TILESET_ECEF_ORIGIN.x,
        TILESET_ECEF_ORIGIN.y,
        TILESET_ECEF_ORIGIN.z
    );
    const mercatorOrigin = mapboxgl.MercatorCoordinate.fromLngLat(
        [longitude, latitude],
        // 与 addTargetModel 相同：高度在 fromLngLat 时传入，而不是事后直接改 Mercator z。
        altitude + TILESET_HEIGHT_OFFSET_METERS
    );
    const mercatorFrame = new THREE.Object3D();
    mercatorFrame.name = 'tiles-mercator-frame';
    // 顶点已经是以此处为原点的 Mercator 坐标；父级只承担线性的整体平移。
    mercatorFrame.position.set(mercatorOrigin.x, mercatorOrigin.y, mercatorOrigin.z);

    return { mercatorFrame, mercatorOrigin };
}

// Mapbox FreeCamera 是左手相机：本地 up 为 -Y；Three 相机本地 up 为 +Y。
const MAPBOX_CAMERA_FRAME = new THREE.Matrix4().makeScale(1, -1, 1);
const _cameraPositionInTiles = new THREE.Vector3();
const _clipPoint = new THREE.Vector4();

/**
 * 从 Mapbox 的自由相机构造供 3d-tiles-renderer 使用的标准 Three 相机。
 * mapboxCamera.projectionMatrix 保存 VP，因此 P = VP × cameraWorld。
 */
function updateTilesCamera(tilesCamera, mapboxCamera, map) {
    const freeCamera = map.getFreeCameraOptions();
    if (!freeCamera.position || !freeCamera.orientation) return;

    // Mapbox 四元数为左手、顺时针定义，转换到 Three 时反转 xyz。
    const rotation = new THREE.Quaternion(
        -freeCamera.orientation.x,
        -freeCamera.orientation.y,
        -freeCamera.orientation.z,
        freeCamera.orientation.w
    );
    tilesCamera.matrix
        .makeRotationFromQuaternion(rotation)
        .multiply(MAPBOX_CAMERA_FRAME)
        .setPosition(
            freeCamera.position.x,
            freeCamera.position.y,
            freeCamera.position.z
        );
    tilesCamera.matrixWorld.copy(tilesCamera.matrix);
    tilesCamera.matrixWorldInverse.copy(tilesCamera.matrixWorld).invert();
    tilesCamera.projectionMatrix
        .copy(mapboxCamera.projectionMatrix)
        .multiply(tilesCamera.matrixWorld);
    tilesCamera.projectionMatrixInverse.copy(tilesCamera.projectionMatrix).invert();
}

/**
 * 将 3D Tiles 的 ECEF OBB 角点先映射到当前 Mercator 场景，再直接按 Mapbox VP 测试。
 * 只要 OBB 未完全落在任一裁剪平面外，就认为它可能可见。
 */
function tileIntersectsMapboxFrustum(tile, tilesRenderer, mapboxCamera, mercatorOrigin) {
    const boundingVolume = tile.engineData.boundingVolume;
    const obb = boundingVolume.obb || boundingVolume.regionObb;
    if (!obb) return true;

    let outsideLeft = true;
    let outsideRight = true;
    let outsideBottom = true;
    let outsideTop = true;
    let outsideNear = true;
    let outsideFar = true;

    for (const point of obb.points) {
        // OBB 仍由 3d-tiles-renderer 以 ECEF 保存，先做与顶点相同的非线性转换。
        const mercatorPoint = ecefToMercator(point).sub(mercatorOrigin);
        _clipPoint
            .set(mercatorPoint.x, mercatorPoint.y, mercatorPoint.z, 1)
            .applyMatrix4(tilesRenderer.group.matrixWorld)
            .applyMatrix4(mapboxCamera.projectionMatrix);

        outsideLeft &&= _clipPoint.x < -_clipPoint.w;
        outsideRight &&= _clipPoint.x > _clipPoint.w;
        outsideBottom &&= _clipPoint.y < -_clipPoint.w;
        outsideTop &&= _clipPoint.y > _clipPoint.w;
        outsideNear &&= _clipPoint.z < -_clipPoint.w;
        outsideFar &&= _clipPoint.z > _clipPoint.w;
    }

    return !(outsideLeft || outsideRight || outsideBottom || outsideTop || outsideNear || outsideFar);
}

/**
 * 将 Mapbox zoom 映射为当前 tileset 的 SSE 阈值。
 * 阈值越小，越容易继续细分到更高精度的子瓦片。
 */
function getErrorTargetFromMapZoom(zoom) {
    if (zoom < 14) return 16;
    if (zoom <= 16) return 4.1;


    if (zoom < 18) return 2.1;
    // return 1 / zoom;
    return 0.02;
}

/** 将 ECEF 3D Tiles 挂入当前 Mapbox Custom Layer 的 Three.js 场景。 */
function add3dtitles(mapboxCamera, renderer, scene, map) {
    const tilesRenderer = new TilesRenderer(TILESET_URL);
    const { mercatorFrame, mercatorOrigin } = createTilesMercatorFrame();
    // 每个已加载模型的顶点都会转为相对此原点的 Mercator 坐标；父级只做整体平移。
    mercatorFrame.add(tilesRenderer.group);
    scene.add(mercatorFrame);
    const tilesCamera = new THREE.Camera();
    tilesCamera.matrixAutoUpdate = false;
    tilesRenderer.setCamera(tilesCamera);
    tilesRenderer.setResolutionFromRenderer(tilesCamera, renderer);
    tilesRenderer.errorTarget = getErrorTargetFromMapZoom(map.getZoom());
    console.log("map.getZoom():::", map.getZoom());

    tilesRenderer.displayActiveTiles = false;

    // 以 Mapbox VP 判断可见性、以 FreeCamera 的真实位置计算距离和 SSE。
    tilesRenderer.registerPlugin({
        calculateTileViewError(tile, target) {
            // 顶点已在 Mercator 坐标，而 3d-tiles-renderer 的包围盒仍是 ECEF。
            // 因此把 Mapbox 相机位置反算为 ECEF 后计算真实距离。
            mercatorToEcef(
                _cameraPositionInTiles.setFromMatrixPosition(tilesCamera.matrixWorld)
            );

            // 包围盒和相机现在均为 ECEF 米坐标，可以计算真实最近距离。
            const distance = tile.engineData.boundingVolume.distanceToPoint(_cameraPositionInTiles);

            // projectionMatrix[5] 约等于 1 / tan(fov / 2)，表示垂直方向的投影比例。
            // 2 / projectionY 表示距离为 1 时可看到的垂直世界高度；再除以画布像素高度，
            // 得到“距离为 1 时，屏幕 1 像素对应多少世界单位（米）”。
            // 最终 distance * sseDenominator 就是相机距离为 d 时，屏幕 1 像素大致对应多少米。
            // Math.abs 用于兼容 Mapbox / Three 坐标轴方向不同造成的符号差异。
            const projectionY = Math.abs(tilesCamera.projectionMatrix.elements[5]);
            const pixelHeight = renderer.domElement.height;
            const sseDenominator = projectionY > 0 && pixelHeight > 0
                ? (2 / projectionY) / pixelHeight
                : 1;

            // 不再使用 3d-tiles-renderer 内部的 Three 视锥：它无法直接处理 Mapbox 的 VP。
            // 改用原始 Mapbox VP 对 ECEF OBB 转换后的 8 个角点做裁剪测试。
            // target.inView = tileIntersectsMapboxFrustum(tile, tilesRenderer, mapboxCamera, mercatorOrigin);
            target.inView = true;

            // SSE = geometricError / (距离 × 投影分母)。距离越近，误差越大，越需要细分。
            target.distance = distance;
            // target.error = distance === 0
            //     ? Infinity
            //     : tile.geometricError / (distance * sseDenominator);
            target.error = 0;

            // console.log("target.error:::", target.error);

            return true;
        },
    });

    tilesRenderer.addEventListener('load-tileset', ({ url }) => {
        console.log('3D Tiles tileset 已加载:', url);
    });
    tilesRenderer.addEventListener('load-model', ({ url }) => {
        console.log('3D Tiles GLB 已加载:', url);
    });
    tilesRenderer.addEventListener('load-error', ({ url, error }) => {
        console.error('3D Tiles 加载失败:', url, error);
    });
    tilesRenderer.addEventListener('load-model', ({ scene }) => {
        // scene 及其子节点矩阵共同将 glTF 顶点放到 ECEF。ECEF -> Mercator 是非线性的，
        // 所以必须在 CPU 上逐顶点转换，不能再使用根节点的线性 makeBasis 近似。
        scene.updateWorldMatrix(true, true);
        scene.traverse(child => {
            if (!child.isMesh) return;

            // 一个 geometry 可能被多个 Mesh 共用；clone 后再改写才不会重复转换。
            const geometry = child.geometry.clone();
            const position = geometry.getAttribute('position');
            const ecefPosition = new THREE.Vector3();
            const mercatorPosition = new THREE.Vector3();
            for (let i = 0; i < position.count; i++) {
                ecefPosition.fromBufferAttribute(position, i).applyMatrix4(child.matrixWorld);
                ecefToMercator(ecefPosition, mercatorPosition).sub(mercatorOrigin);
                position.setXYZ(i, mercatorPosition.x, mercatorPosition.y, mercatorPosition.z);
            }
            position.needsUpdate = true;
            geometry.computeVertexNormals();
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            child.geometry = geometry;

            child.material = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                roughness: 0.8,
                metalness: 0.2,
                // 保留地形深度遮挡；将模型深度值轻微拉向相机，避免近乎共面时 z-fighting。
                // 负值表示更靠近相机，数值可在 -1 到 -4 间按效果微调。
                // polygonOffset: true,
                // polygonOffsetFactor: -1,
                // polygonOffsetUnits: -1,
            });
            child.frustumCulled = false;
        });

        // 顶点已烘焙为 Mercator 局部坐标，清空原 ECEF / glTF 节点变换。
        // 保留节点层级，以兼容 tilesRenderer 的瓦片挂载、显示和卸载逻辑。
        scene.traverse(child => {
            child.position.set(0, 0, 0);
            child.quaternion.identity();
            child.scale.set(1, 1, 1);
            child.matrix.identity();
            child.matrixWorld.identity();
            child.matrixAutoUpdate = true;
        });
    });

    // Mapbox 驱动 renderer.render()，没有独立 requestAnimationFrame，因此每帧在这里更新瓦片。
    const previousOnBeforeRender = scene.onBeforeRender;
    scene.onBeforeRender = function (...args) {

        previousOnBeforeRender.apply(this, args);
        updateTilesCamera(tilesCamera, mapboxCamera, map);
        tilesRenderer.setResolutionFromRenderer(tilesCamera, renderer);
        tilesRenderer.errorTarget = getErrorTargetFromMapZoom(map.getZoom());
        tilesRenderer.update();
    };

    console.log('开始加载 3D Tiles:', TILESET_URL);
    return tilesRenderer;
}

//我们拿到的
/**
 * 将 ECEF 坐标转换为 Mercator 坐标。
 * @param {THREE.Vector3} ecefPosition - ECEF 坐标。
 * @returns {THREE.Vector3} - Mercator 坐标。
 */
function ecefToMercator(ecefPosition, target = new THREE.Vector3()) {
    const [longitude, latitude, altitude] = ecefToLla(
        ecefPosition.x,
        ecefPosition.y,
        ecefPosition.z
    );
    const mercator = mapboxgl.MercatorCoordinate.fromLngLat([longitude, latitude], altitude);
    return target.set(mercator.x, mercator.y, mercator.z);
}

/** 将 Mapbox Mercator 世界坐标反算为 ECEF 米坐标。 */
function mercatorToEcef(mercatorPosition, target = mercatorPosition) {
    const mercator = new mapboxgl.MercatorCoordinate(
        mercatorPosition.x,
        mercatorPosition.y,
        mercatorPosition.z
    );
    const { lng, lat } = mercator.toLngLat();
    return target.copy(llaToEcef(lng, lat, mercator.toAltitude()));
}

function llaToEcef(longitude, latitude, altitude) {
    const a = 6378137.0;
    const b = 6356752.314245;
    const e2 = 1 - (b * b) / (a * a);
    const longitudeRad = longitude * Math.PI / 180;
    const latitudeRad = latitude * Math.PI / 180;
    const radius = a / Math.sqrt(1 - e2 * Math.sin(latitudeRad) ** 2);
    const cosLatitude = Math.cos(latitudeRad);

    return new THREE.Vector3(
        (radius + altitude) * cosLatitude * Math.cos(longitudeRad),
        (radius + altitude) * cosLatitude * Math.sin(longitudeRad),
        (radius * (1 - e2) + altitude) * Math.sin(latitudeRad)
    );
}

export default add3dtitles;
