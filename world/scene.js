import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createPhysics } from './physics.js';

export const exhibits = [
  { id: 'experience', number: '01', title: 'Experience', x: -7, z: -8, angle: 0, color: '#377c79', subtitle: 'PLACES / PEOPLE / IMPACT' },
  { id: 'projects', number: '02', title: 'Skills & Projects', x: 7, z: -8, angle: 0, color: '#be6856', subtitle: 'IDEAS INTO REALITY' },
  { id: 'about', number: '03', title: 'About me', x: -11, z: 3, angle: Math.PI / 2, color: '#667aab', subtitle: 'A LITTLE LOGIC. A LOT OF CARE.' },
  { id: 'contact', number: '04', title: 'Get in touch', x: 11, z: 3, angle: -Math.PI / 2, color: '#74895e', subtitle: 'LET\'S BUILD SOMETHING.' }
];

export async function createWorld(host, callbacks) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#a7c4c2');
  scene.fog = new THREE.Fog('#b2c5be', 35, 75);
  const camera = new THREE.PerspectiveCamera(53, 1, 0.1, 100);
  const cleanups = [];
  const materials = new Map();
  const material = (color, emissive = false) => {
    const key = color + emissive;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...(emissive ? { emissive: color, emissiveIntensity: 1.7 } : {}) }));
    return materials.get(key);
  };
  const box = (parent, x, y, z, w, h, d, color, glow = false) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material(color,glow));
    mesh.position.set(x,y,z); mesh.castShadow = !glow; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const cylinder = (parent,x,y,z,top,bottom,height,color,segments=32) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,segments),material(color));
    mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  function label(parent, text, x,y,z,w,h,color='#fff4d8',background=null) {
    const canvas = document.createElement('canvas'); canvas.width=1024; canvas.height=256;
    const ctx=canvas.getContext('2d');
    if(background) { ctx.fillStyle=background; ctx.fillRect(0,0,1024,256); }
    ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='500 76px Arial'; ctx.fillText(text,512,128,960);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    mesh.position.set(x,y,z); parent.add(mesh); return mesh;
  }
  scene.add(new THREE.HemisphereLight('#e4f3ff','#6c7b68',1.6));
  const sun=new THREE.DirectionalLight('#fff0cf',2.4); sun.position.set(-8,18,9); sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,far:60}); sun.shadow.normalBias=.035; scene.add(sun);
  scene.add(new THREE.AmbientLight('#d5e8dc',.3));
  const movement = await createPhysics(exhibits);
  const physics = movement.world;
  box(scene,0,-.2,0,29,.4,28,'#c4c4b7');
  for(let x=-12;x<=12;x+=3) for(let z=-12;z<=12;z+=3) {
    box(scene,x,-.007,z,2.975,.025,2.975,(x+z)%6===0?'#b5b9ad':'#bec1b6');
  }
  // Perimeter architecture stays open toward the camera to preserve sightlines.
  box(scene,0,4,-13,28,8,.5,'#d5d8cb');
  box(scene,-14,4,0,.5,8,26,'#d5d8cb'); box(scene,14,4,0,.5,8,26,'#d5d8cb');
  for(const x of [-13,-4.5,4.5,13]) {
    box(scene,x,4,-12.6,.55,8,.55,'#718c87');
    box(scene,x,7.8,-2,.24,.25,22,'#365352');
  }
  for(const z of [-12,-4,4,11]) box(scene,0,7.8,z,27,.25,.24,'#365352');
  for(const x of [-9,0,9]) {
    box(scene,x,5.8,-12.68,5.5,2.2,.1,'#86b8bb');
    for(let i=-2;i<=2;i++) box(scene,x+i,5.8,-12.55,.055,2.2,.08,'#416e70');
  }
  box(scene,0,4.2,-12.3,27,.17,.2,'#edc78a',true);
  // A raised perimeter gallery echoes the reference without adding a second walkable floor.
  for(const x of [-13.4,13.4]) {
    box(scene,x,4.2,-1,1.15,.22,24,'#718c87');
    for(let z=-12;z<11;z+=2) box(scene,x,4.85,z,.09,1.25,.09,'#365352');
    box(scene,x,5.45,-1,.09,.08,24,'#365352');
  }
  function plant(parent,x,z,scale=1) {
    const group=new THREE.Group(); group.position.set(x,0,z); group.scale.setScalar(scale); parent.add(group);
    cylinder(group,0,.32,0,.4,.3,.64,'#788c7d',12);
    cylinder(group,0,1,0,.065,.09,1.45,'#727c5b',7);
    for(let i=0;i<7;i++) {
      const leaf=new THREE.Mesh(new THREE.SphereGeometry(.5,6,4),material(i%2?'#63856a':'#3f6a58'));
      const angle=i*2.4; leaf.position.set(Math.sin(angle)*.28,1+i*.12,Math.cos(angle)*.28); leaf.scale.set(.55,.5,1.4); leaf.rotation.set(.5,angle,.2); group.add(leaf);
    }
  }
  for(const x of [-12,-3.5,3.5,12]) plant(scene,x,-10,1.5);
  cylinder(scene,0,.16,-1,3.5,3.6,.32,'#799084',64);
  cylinder(scene,0,.43,-1,2.7,2.9,.55,'#e1d4b6',48);
  cylinder(scene,0,.74,-1,2.1,2.1,.2,'#365b4d',48);
  for(let i=0;i<9;i++) plant(scene,Math.sin(i*2.4)*1.45,-1+Math.cos(i*2.4)*1.45,.85);
  box(scene,0,1.15,.85,3.8,1.4,.22,'#254c4b');
  label(scene,'A brighter you.',0,1.34,1,3.5,.7);
  label(scene,'EXPLORE. BUILD. ENJOY.',0,.91,1,3,.27,'#cddfcf');
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2,.055,8,80),material('#ffdf9c',true)); ring.rotation.x=Math.PI/2; ring.position.set(0,5.5,-1); scene.add(ring);
  for(const x of [-2.3,2.3]) cylinder(scene,x,6.65,-1,.022,.022,2.3,'#365352',6);
  label(scene,'GOOD STORIES. BETTER HUMANS.',0,6.3,-2,6,1,'#f5efda','#254c4b');

  exhibits.forEach((exhibit,index) => {
    const booth=new THREE.Group(); booth.position.set(exhibit.x,0,exhibit.z); booth.rotation.y=exhibit.angle; scene.add(booth);
    box(booth,0,1.9,-1,5.9,3.8,.3,exhibit.color);
    box(booth,0,3.6,.35,6.2,.6,3.1,'#294b4b');
    box(booth,0,3.25,1.8,5.9,.05,.06,'#ffdf9c',true);
    label(booth,exhibit.title.toUpperCase(),0,3.63,1.94,5.5,.65);
    label(booth,exhibit.subtitle,0,2.8,-.81,4.8,.45,'#ffffff');
    box(booth,0,.77,.3,4.8,.13,1.2,'#d9c7a1');
    for(const x of [-2.1,2.1]) box(booth,x,.37,.3,.12,.75,.8,'#365352');
    for(const x of [-1.2,1.2]) {
      box(booth,x,1.32,.19,1.2,.77,.08,'#25383d'); box(booth,x,1.32,.245,1.08,.64,.02,index===1?'#70acbc':'#e4debd');
      box(booth,x,.99,.2,.05,.35,.05,'#25383d');
      for(let j=0;j<4;j++) box(booth,x-.3,1.5-j*.12,.27,.55+(j%2)*.25,.022,.012,index===1?'#c6dfd6':'#789a87');
    }
    for(let i=0;i<5;i++) box(booth,-2.1+i*.13,1.02,.3,.1,.4+(i%3)*.06,.28,['#315d69','#ae644b','#c0ac78'][i%3]);
    plant(booth,2.4,1.5,.85);
    const marker=cylinder(booth,0,.025,3.1,.85,.85,.04,exhibit.color,40);
    label(booth,exhibit.number,0,.06,3.1,.7,.7).rotation.x=-Math.PI/2;
    const point=new THREE.Vector3(0,0,3.1).applyAxisAngle(new THREE.Vector3(0,1,0),exhibit.angle).add(booth.position);
    exhibit.trigger=point; exhibit.marker=marker;
  });
  // Static meshes sharing a material are submitted together to reduce integrated-GPU overhead.
  scene.updateMatrixWorld(true);
  const batches=new Map(), originals=[];
  scene.traverse(object=> {
    if(!object.isMesh || object.material.transparent) return;
    const key=object.material.uuid;
    if(!batches.has(key)) batches.set(key,{material:object.material,geometries:[]});
    batches.get(key).geometries.push(object.geometry.clone().applyMatrix4(object.matrixWorld));
    originals.push(object);
  });
  for(const object of originals) { object.removeFromParent(); object.geometry.dispose(); }
  for(const batch of batches.values()) {
    const geometry=mergeGeometries(batch.geometries);
    const mesh=new THREE.Mesh(geometry,batch.material); mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh);
    batch.geometries.forEach(g=>g.dispose());
  }
  const playerBody=movement.body;
  const avatar=new THREE.Group(); avatar.rotation.y=Math.PI; scene.add(avatar);
  const keys=new Set(), taps=new Set(); let stopped=false,paused=false,near=null,frame=0,animation='idle',mixer,actions={};
  const clock=new THREE.Clock(); const direction=new THREE.Vector3();
  let frames=0, elapsed=0;
  const listen=(target,type,fn,options) => { target.addEventListener(type,fn,options); cleanups.push(()=>target.removeEventListener(type,fn,options)); };
  const resize=()=> { const w=host.clientWidth,h=host.clientHeight; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); };
  const observer=new ResizeObserver(resize); observer.observe(host); resize();
  const resources=()=> {
    const textures=new Set(); scene.traverse(o=> { o.geometry?.dispose(); for(const m of Array.isArray(o.material)?o.material:[o.material]) if(m) { for(const value of Object.values(m)) if(value?.isTexture) textures.add(value); m.dispose(); } }); textures.forEach(t=>t.dispose());
  };
  function dispose() { stopped=true; cancelAnimationFrame(frame); observer.disconnect(); cleanups.forEach(fn=>fn()); mixer?.stopAllAction(); resources(); physics.free(); renderer.dispose(); renderer.domElement.remove(); }
  callbacks.onStatus('Preparing Skater Male');
  try {
    const loader=new FBXLoader(); const base='/world-assets/kenney/';
    const [model,idle,run,skin]=await Promise.all([loader.loadAsync(base+'Model/characterMedium.fbx'),loader.loadAsync(base+'Animations/idle.fbx'),loader.loadAsync(base+'Animations/run.fbx'),new THREE.TextureLoader().loadAsync(base+'Skins/skaterMaleA.png')]);
    skin.colorSpace=THREE.SRGBColorSpace; skin.magFilter=THREE.NearestFilter;
    model.traverse(o=> { if(o.isMesh) { o.material=new THREE.MeshStandardMaterial({map:skin,roughness:.9}); o.castShadow=true; o.frustumCulled=false; } });
    const bounds=new THREE.Box3().setFromObject(model); const size=bounds.getSize(new THREE.Vector3()); const scale=1.9/size.y;
    model.scale.setScalar(scale); model.position.y=-bounds.min.y*scale; avatar.add(model);
    mixer=new THREE.AnimationMixer(model);
    // The pack includes a one-frame pose alongside the real animation in each FBX.
    for(const [name,source] of [['idle',idle],['run',run]]) {
      const clip=[...source.animations].sort((a,b)=>b.duration-a.duration)[0]; if(!clip) throw new Error('Character animation is missing.');
      const animationClip=clip.clone();
      actions[name]=mixer.clipAction(animationClip); actions[name].play(); actions[name].setEffectiveWeight(name==='idle'?1:0);
      source.traverse(o=> { o.geometry?.dispose(); });
    }
  } catch(e) { dispose(); throw new Error('The avatar could not load. Please retry or return to the portfolio. '+e.message); }
  const mapping={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  const keyDirection=e=>mapping[e.code]||({w:'forward',s:'backward',a:'left',d:'right',ArrowUp:'forward',ArrowDown:'backward',ArrowLeft:'left',ArrowRight:'right'})[e.key];
  listen(window,'keydown',e=> {
    if(paused || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const movementKey=keyDirection(e);
    if(movementKey) { e.preventDefault(); keys.add(movementKey); taps.add(movementKey); }
    if((e.code==='KeyE'||e.key?.toLowerCase()==='e') && near && !e.repeat) { keys.clear(); callbacks.onOpen(near); }
  });
  listen(window,'keyup',e=>keys.delete(keyDirection(e)));
  listen(window,'blur',()=> { keys.clear(); taps.clear(); });
  listen(document,'visibilitychange',()=> { keys.clear(); taps.clear(); clock.getDelta(); });
  listen(renderer.domElement,'webglcontextlost',e=> { e.preventDefault(); paused=true; callbacks.onStatus('Graphics paused. Reload this page to reopen the hall.'); });
  camera.position.set(0,4.5,16.5); camera.lookAt(0,1.7,4);
  const desiredCamera=new THREE.Vector3(),lookAt=new THREE.Vector3();
  function animate() {
    if(stopped) return; frame=requestAnimationFrame(animate);
    const realDelta=clock.getDelta(); const dt=Math.min(realDelta,.05); if(document.hidden) return;
    // Preserve short key taps that begin and end between two rendered frames.
    const pressed=key=>keys.has(key)||taps.has(key);
    direction.set(Number(pressed('right'))-Number(pressed('left')),0,Number(pressed('backward'))-Number(pressed('forward')));
    taps.clear();
    const moving=!paused&&direction.lengthSq()>0;
    if(moving) {
      direction.normalize(); movement.move(direction.x,direction.z,dt);
      const target=Math.atan2(direction.x,direction.z); avatar.rotation.y+=Math.atan2(Math.sin(target-avatar.rotation.y),Math.cos(target-avatar.rotation.y))*Math.min(1,dt*12);
    }
    const current=playerBody.translation(); avatar.position.set(current.x,0,current.z);
    const nextAnimation=moving?'run':'idle';
    if(animation!==nextAnimation) { actions[animation].fadeOut(.18); actions[nextAnimation].reset().setEffectiveWeight(1).fadeIn(.18).play(); animation=nextAnimation; }
    if(!paused) mixer.update(dt);
    desiredCamera.set(THREE.MathUtils.clamp(current.x,-12.5,12.5),4.5,current.z+8.5); camera.position.lerp(desiredCamera,1-Math.exp(-5*dt));
    lookAt.set(current.x,1.3,current.z-2.7); camera.lookAt(lookAt);
    const nearby=exhibits.find(e=>e.trigger.distanceTo(avatar.position)<2.1)?.id??null;
    if(nearby!==near) { near=nearby; callbacks.onNear(near); }
    renderer.render(scene,camera);
    frames++; elapsed+=realDelta;
    if(elapsed>=1) { callbacks.onStats({fps:Math.round(frames/elapsed),calls:renderer.info.render.calls}); renderer.domElement.dataset.position=JSON.stringify({x:current.x,z:current.z}); renderer.domElement.dataset.animation=animation; frames=0;elapsed=0; }
  }
  callbacks.onStatus(''); animate();
  return {
    dispose,
    pause(value) { paused=value; keys.clear(); taps.clear(); },
    input(key,value) { if(value&&!paused) keys.add(key); else keys.delete(key); },
    reset() { keys.clear(); taps.clear(); movement.reset(); avatar.rotation.y=Math.PI; camera.position.set(0,4.5,16.5); },
    quality(value) { renderer.setPixelRatio(value==='low'?1:Math.min(devicePixelRatio,value==='high'?1.75:1.25)); renderer.shadowMap.enabled=value!=='low'; sun.castShadow=value!=='low'; scene.traverse(o=> { if(o.material) for(const m of Array.isArray(o.material)?o.material:[o.material]) m.needsUpdate=true; }); resize(); }
  };
}
