import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ===== 场景 =====
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f0f1a);

// ===== 相机 =====
const camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 0.01, 1000
);
camera.position.set(0, 1.5, 4);

// ===== 渲染器 =====
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ===== 轨道控制器 =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;

// ===== 灯光 =====
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

scene.add(new THREE.HemisphereLight(0x4488ff, 0x002244, 0.3));

// ===== 地面圆盘 =====
const ground = new THREE.Mesh(
    new THREE.CircleGeometry(5, 64),
    new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ===== 加载 GLB 模型 =====
const loadingEl = document.getElementById('loading');
const loader = new GLTFLoader();

loader.load(
    './models/scene.glb',
    (gltf) => {
        const model = gltf.scene;

        // 自动居中 & 等比缩放到合适大小
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;

        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        // 开启阴影
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(model);
        loadingEl.style.display = 'none';

        // 播放动画（如果有）
        if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
            window._animMixer = mixer;
        }
    },
    (progress) => {
        if (progress.total > 0) {
            const pct = ((progress.loaded / progress.total) * 100).toFixed(0);
            loadingEl.textContent = `加载中... ${pct}%`;
        }
    },
    (error) => {
        console.error('模型加载失败:', error);
        loadingEl.textContent = '⚠️ 加载失败，请检查控制台';
    }
);

// ===== 窗口自适应 =====
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== 动画循环 =====
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    if (window._animMixer) window._animMixer.update(clock.getDelta());
    controls.update();
    renderer.render(scene, camera);
}
animate();
