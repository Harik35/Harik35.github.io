import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const centerDisplay = { x: 0, z: 3, width: 6, depth: 3.2, height: .18, angle: -.35, carLength: 5.2 };
export const CENTER_DISPLAY_ROTATION_SPEED = .35;

export async function loadCenterDisplay() {
  const { scene: source } = await new GLTFLoader().loadAsync('/world-assets/camaro/camaro.glb');
  const group = new THREE.Group();
  group.name = 'Camaro display';
  const c = centerDisplay;
  const podiumHeight = .42;
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(c.width / 2, c.width / 2, podiumHeight, 64),
    new THREE.MeshStandardMaterial({ color: '#426b5b', roughness: .82 }));
  podium.position.y = podiumHeight / 2; podium.receiveShadow = true; group.add(podium);
  const podiumTop = new THREE.Mesh(new THREE.CylinderGeometry(c.width / 2 - .18, c.width / 2 - .18, .08, 64),
    new THREE.MeshStandardMaterial({ color: '#6f9b7d', roughness: .72 }));
  podiumTop.position.y = podiumHeight + .04; podiumTop.receiveShadow = true; group.add(podiumTop);
  source.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(source);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = c.carLength / Math.max(size.x, size.z);
  const center = bounds.getCenter(new THREE.Vector3());
  const transform = new THREE.Matrix4().makeRotationY(size.z > size.x ? Math.PI / 2 : 0)
    .multiply(new THREE.Matrix4().makeScale(scale, scale, scale))
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
  const batches = new Map();
  const geometries = new Set();
  source.traverse(object => {
    if (!object.isMesh) return;
    const material = object.material;
    // Tinted glass avoids a transmission render pass on integrated graphics.
    if (material.transmission > 0) {
      material.transmission = 0; material.transparent = true;
      material.opacity = .28; material.depthWrite = false; material.roughness = .25;
    }
    material.roughness = Math.max(material.roughness, .22);
    if (!batches.has(material)) batches.set(material, []);
    const geometry = object.geometry.clone().applyMatrix4(transform.clone().multiply(object.matrixWorld));
    batches.get(material).push(geometry); geometries.add(object.geometry);
  });
  for (const [material, parts] of batches) {
    // Preserve individual glass pieces for transparent depth sorting.
    const output = material.transparent ? parts : [mergeGeometries(parts)];
    for (const geometry of output) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = podiumHeight + .08;
      mesh.castShadow = !material.transparent; mesh.receiveShadow = true;
      group.add(mesh);
    }
    if (!material.transparent) parts.forEach(part => part.dispose());
  }
  geometries.forEach(geometry => geometry.dispose());
  group.position.set(c.x, 0, c.z); group.rotation.y = c.angle;
  return group;
}
