import * as THREE from 'three';

export const personalAsset = name => `/world-assets/personal/${name}`;
export const posters = [
  { file: 'spider-man.jpg', name: 'Spider-Man', collection: 'Marvel' },
  { file: 'doctor-strange.jpg', name: 'Doctor Strange', collection: 'Marvel' },
  { file: 'loki.jpg', name: 'Loki', collection: 'Marvel' },
  { file: 'jon-snow.jpg', name: 'Jon Snow', collection: 'Game of Thrones' },
  { file: 'white-walker.jpg', name: 'White Walker', collection: 'Game of Thrones' }
];

export async function loadPersonalArtwork() {
  const files = ['geekywolf.svg', 'ey.png', 'controlqore.png', 'dotnet.png', 'angular.png', 'azure.jpg', ...posters.map(p => p.file)];
  const entries = await Promise.all(files.map(async file => {
    const img = new Image();
    img.src = personalAsset(file);
    try { await img.decode(); return [file, img]; }
    catch { console.warn(`Could not load stall artwork: ${file}`); return [file, null]; }
  }));
  return new Map(entries);
}

export function decoratePersonalStall(booth, id, artwork, { box, label }) {
  function picture(file, name, x, y, z, w, h, background = '#14272b') {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(768 * Math.min(1, w / h));
    canvas.height = Math.round(768 * Math.min(1, h / w));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = artwork.get(file);
    if (img) {
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * .92;
      const width = img.width * scale, height = img.height * scale;
      ctx.drawImage(img, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    } else {
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.font = '28px Arial';
      ctx.fillText(name, canvas.width / 2, canvas.height / 2, canvas.width - 20);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    mesh.position.set(x, y, z); booth.add(mesh);
  }
  const experience = id === 'experience';
  const dark = experience ? '#17383c' : '#342039';
  const accent = experience ? '#e9cb87' : '#ff9bce';
  box(booth, 0, .4, .68, 4.6, .65, .12, dark);
  label(booth, experience ? 'BUILD / SHIP / LEARN / REPEAT' : 'MARVEL / GAME OF THRONES', 0, .43, .76, 4.1, .3, accent);
  for (const x of [-2.83, 2.83]) box(booth, x, 1.95, -.77, .08, 2.9, .12, dark);
  box(booth, 0, 3.18, -.7, 5.5, .04, .09, accent, true);

  if (experience) {
    picture('geekywolf.svg', 'Geekywolf', -1.35, 3.64, 1.96, 2.25, .44);
    picture('ey.png', 'EY', 1.4, 3.65, 1.96, 1.3, .49);
    box(booth, .2, 3.63, 1.94, .018, .4, .02, accent);
    label(booth, 'EXPERIENCE / SOFTWARE ENGINEER', 0, 2.98, -.79, 4.8, .26, '#ffffff');
    for (const [i, file, name] of [[0, 'dotnet.png', '.NET'], [1, 'angular.png', 'Angular'], [2, 'azure.jpg', 'Azure']]) {
      const x = (i - 1) * 1.65;
      box(booth, x, 2.08, -.71, 1.45, 1.35, .12, dark);
      picture(file, name, x, 2.19, -.637, 1.29, .95, '#ffffff');
      label(booth, name, x, 1.61, -.635, 1.2, .22);
    }
    box(booth, 0, 1.04, .38, 1.8, .09, .8, '#28343a');
    box(booth, 0, 1.48, .03, 1.8, .94, .1, '#28343a');
    picture('controlqore.png', 'ControlQore', 0, 1.52, .092, 1.64, .68, '#ffffff');
    label(booth, 'PROJECT / CONTROLQORE', 0, 1.13, .097, 1.65, .16, accent);
    for (let i = 0; i < 4; i++) {
      box(booth, -1.8, .91 + i * .13, .4, .95, .11, .63, ['#385369', '#9d7056', '#376964', '#805769'][i]);
      label(booth, ['CLEAN CODE', 'SYSTEM DESIGN', 'CLOUD', 'BUILD BETTER'][i], -1.8, .91 + i * .13, .722, .8, .09);
    }
  } else {
    label(booth, 'FUN PART', 0, 3.63, 1.96, 4.7, .6, '#ffc2e2');
    label(booth, 'STORIES / CHARACTERS / OTHER WORLDS', 0, 2.98, -.79, 4.9, .25);
    posters.forEach((poster, i) => {
      const x = (i - 2) * 1.08;
      box(booth, x, 2.03, -.69, 1, 1.53, .14, '#251e2a');
      picture(poster.file, poster.name, x, 2.1, -.608, .9, 1.22);
      label(booth, poster.name, x, 1.38, -.602, .91, .14);
    });
    // A small cinema clapper and stacked volumes keep the desk three-dimensional.
    box(booth, -.9, 1.14, .35, 1.3, .61, .16, '#25252b');
    label(booth, 'THE FUN PART', -.9, 1.15, .44, 1.15, .23);
    for (let i = 0; i < 7; i++) box(booth, -1.45 + i * .18, 1.5, .35, .17, .13, .18, i % 2 ? '#eee6da' : '#25252b');
    for (let i = 0; i < 3; i++) {
      box(booth, 1.02, .93 + i * .14, .4, 1.2, .12, .65, ['#693f57', '#365569', '#7c694e'][i]);
      label(booth, ['MARVEL', 'WESTEROS', 'OTHER WORLDS'][i], 1.02, .93 + i * .14, .733, 1.08, .1);
    }
  }
}
