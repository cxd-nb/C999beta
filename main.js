import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ========== 操作提示模态框 ==========
const helpModal = document.getElementById('help-modal');
const closeModalBtn = document.getElementById('close-modal');
const STORAGE_KEY = 'help_modal_shown';

// 关闭按钮事件
closeModalBtn.addEventListener('click', () => {
  helpModal.classList.add('hidden');
  });
  
// 将相机重置到当前模型的合适视角
function resetCameraToModel() {
  if (!currentModel) return;

  const box = new THREE.Box3().setFromObject(currentModel);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  
  camera.near = maxDim / 100;
  camera.far = maxDim * 100;
  camera.updateProjectionMatrix();

  const distance = maxDim * 1.2;
  camera.position.set(
    center.x + distance * 1.1,
    center.y + distance * 1.1,
    center.z + distance * 1.1
  );
  controls.target.copy(center);
  controls.update();
}
// --- 初始化场景、相机、渲染器 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2a2a);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(3, 2, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 光照系统 ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(5, 10, 7);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(-5, 2, -5);
scene.add(fillLight);

// --- 轨道控制器 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.update();

// --- 模型管理 ---
let currentModel = null; // 当前场景中的模型对象
const loader = new GLTFLoader();
const loadingDiv = document.getElementById('loading');
const modelSelect = document.getElementById('model-select');

/**
 * 加载并显示指定路径的模型
 * @param {string} modelPath - 模型文件路径
 */
function loadModel(modelPath) {
  // 显示加载提示
  loadingDiv.style.opacity = '1';
  loadingDiv.textContent = '模型加载中...';
  
  // 移除旧模型
  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  loader.load(
    modelPath,
    (gltf) => {
      // 新模型
      currentModel = gltf.scene;
      scene.add(currentModel);

      // 自动调整相机适配模型
      resetCameraToModel();

      // 隐藏加载提示
      loadingDiv.style.opacity = '0';
      setTimeout(() => loadingDiv.textContent = '', 500);
    },
    (xhr) => {
      const percent = xhr.total ? Math.round((xhr.loaded / xhr.total) * 100) : 0;
      loadingDiv.textContent = `模型加载中... ${percent}%`;
    },
    (error) => {
      console.error('模型加载失败:', error);
      loadingDiv.textContent = '模型加载失败，请检查文件是否存在';
    }
  );
}

// --- 监听模型选择变化 ---
modelSelect.addEventListener('change', (event) => {
  const selectedPath = event.target.value;
  loadModel(selectedPath);
});

// --- 初始加载第一个模型 ---
loadModel(modelSelect.value);

// --- 动画循环 ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- 响应窗口大小变化 ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// --- 重置视角按钮事件 ---
document.getElementById('reset-view').addEventListener('click', resetCameraToModel);