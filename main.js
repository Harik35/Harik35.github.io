/* ============================================================
   Harikrishnan P M — Portfolio
   1. initParallax()   — layered hero, rAF driven, reduced-motion aware
   2. initCaseStudies() — work card -> modal dialog
   3. initPortrait()   — transparent cutout with background-removal fallback
   ============================================================ */

function initParallax() {
  const hero = document.querySelector('.hero');
  const runway = document.querySelector('.hero-runway');
  const layers = [...document.querySelectorAll('[data-speed]')].map(element => ({
    element, speed: Number(element.dataset.speed), limit: Number(element.dataset.max), max: 0
  }));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let lastScroll = -1;
  let origin = 0;
  let travel = 0;

  function measure() {
    layers.forEach(({ element }) => element.style.removeProperty('transform'));
    origin = runway.getBoundingClientRect().top + window.scrollY;
    travel = Math.max(0, runway.offsetHeight - hero.offsetHeight);
    const bounds = hero.getBoundingClientRect();
    layers.forEach(layer => {
      const room = layer.element.getBoundingClientRect().top - bounds.top - 100;
      layer.max = layer.element.classList.contains('paper') ? layer.limit : Math.max(0, Math.min(layer.limit, room));
    });
    lastScroll = -1;
  }

  function animate() {
    const scroll = Math.min(travel, Math.max(0, window.scrollY - origin));
    if (scroll !== lastScroll) {
      layers.forEach(({ element, speed, max }) => {
        element.style.transform = `translate3d(0, ${-Math.min(scroll * speed, max)}px, 0)`;
      });
      lastScroll = scroll;
    }
    frame = requestAnimationFrame(animate);
  }

  function syncMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    measure();
    if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate);
  }

  reducedMotion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('resize', syncMotion, { passive: true });
  syncMotion();
}

function initCaseStudies() {
  const caseDialog = document.getElementById('case-study');
  const caseBody = caseDialog.querySelector('.case-body');

  document.querySelectorAll('.case-open').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const card = trigger.closest('.work-card');
      caseBody.replaceChildren(card.querySelector('template').content.cloneNode(true));
      caseDialog.setAttribute('aria-label', card.querySelector('h3').textContent + ' case study');
      caseBody.scrollTop = 0;
      // Measured before the scrollbar is hidden so the page behind cannot shift.
      document.body.style.paddingRight = (window.innerWidth - document.documentElement.clientWidth) + 'px';
      caseDialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });

  caseDialog.addEventListener('click', event => {
    if (event.target === caseDialog) caseDialog.close();
  });

  // Some browsers do not fire the native cancel default, so Escape is handled explicitly.
  caseDialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      caseDialog.close();
    }
  });

  caseDialog.addEventListener('close', () => {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  });
}

function initPortrait() {
  const portrait = document.getElementById('portrait');

  function removeBackground(source) {
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(source, 0, 0);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = image;
    const visited = new Uint8Array(width * height);
    const queue = new Uint32Array(width * height);
    let head = 0;
    let tail = 0;

    // Only edge-connected pale pixels are removed, preserving light details inside the portrait.
    function enqueue(index) {
      if (visited[index]) return;
      visited[index] = 1;
      const pixel = index * 4;
      const low = Math.min(data[pixel], data[pixel + 1], data[pixel + 2]);
      const high = Math.max(data[pixel], data[pixel + 1], data[pixel + 2]);
      if (low > 208 && high - low < 35) queue[tail++] = index;
    }

    for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { enqueue(y * width); enqueue(y * width + width - 1); }

    while (head < tail) {
      const index = queue[head++];
      const pixel = index * 4;
      const lightness = Math.min(data[pixel], data[pixel + 1], data[pixel + 2]);
      data[pixel + 3] = Math.round(255 * Math.max(0, (238 - lightness) / 30));
      const x = index % width;
      if (x > 0) enqueue(index - 1);
      if (x < width - 1) enqueue(index + 1);
      if (index >= width) enqueue(index - width);
      if (index < width * (height - 1)) enqueue(index + width);
    }

    context.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  }

  // A hand-made transparent photo.png wins; otherwise profile.png is cut out in the browser.
  const cutout = new Image();
  cutout.onload = () => {
    portrait.src = cutout.src;
    portrait.classList.remove('unprocessed');
  };
  cutout.onerror = () => {
    const source = new Image();
    source.onload = () => {
      try {
        portrait.src = removeBackground(source);
        portrait.classList.remove('unprocessed');
      } catch {
        portrait.classList.add('unprocessed');
      }
    };
    source.src = 'profile.png';
  };
  cutout.src = 'photo.png';
}

initParallax();
initCaseStudies();
initPortrait();
