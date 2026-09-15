(() => {
  const state = new WeakMap();

  function setup(stage) {
    if (stage.dataset.videoResizeReady === '1') return;
    const video = stage.querySelector('video.cropMedia');
    if (!video) return;
    stage.dataset.videoResizeReady = '1';

    const st = { scale: 1, x: 0, y: 0, resizing: false, moving: false, startX: 0, startY: 0, startScale: 1, startMoveX: 0, startMoveY: 0 };
    state.set(stage, st);

    // The selected ratio is the canvas. Keep the ORIGINAL video's aspect ratio
    // inside it instead of pre-cropping with object-fit: cover.
    video.style.objectFit = 'contain';
    video.style.objectPosition = 'center';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.maxHeight = 'none';
    video.style.transformOrigin = 'center center';
    video.style.cursor = 'move';

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'videoResizeHandle';
    handle.title = '드래그해서 원본 영상 크기 조절';
    handle.setAttribute('aria-label', '원본 영상 크기 조절');
    handle.innerHTML = '↘';
    stage.appendChild(handle);

    const badge = document.createElement('div');
    badge.className = 'videoScaleBadge';
    stage.appendChild(badge);

    const apply = () => {
      const s = Math.max(0.25, Math.min(4, st.scale));
      st.scale = s;
      video.style.transform = `translate(${st.x}px, ${st.y}px) scale(${s})`;
      badge.textContent = `원본 크기 ${Math.round(s * 100)}%`;
      stage.dataset.videoScale = String(s);
      stage.dataset.videoMoveX = String(st.x);
      stage.dataset.videoMoveY = String(st.y);
    };
    apply();

    // Drag the actual original video freely inside the fixed ratio canvas.
    video.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      video.setPointerCapture(e.pointerId);
      st.moving = true;
      st.startX = e.clientX;
      st.startY = e.clientY;
      st.startMoveX = st.x;
      st.startMoveY = st.y;
      stage.classList.add('isVideoMoving');
    });
    video.addEventListener('pointermove', (e) => {
      if (!st.moving) return;
      e.preventDefault();
      e.stopPropagation();
      st.x = st.startMoveX + (e.clientX - st.startX);
      st.y = st.startMoveY + (e.clientY - st.startY);
      apply();
    });
    const stopMove = (e) => {
      st.moving = false;
      stage.classList.remove('isVideoMoving');
      e?.stopPropagation?.();
    };
    video.addEventListener('pointerup', stopMove);
    video.addEventListener('pointercancel', stopMove);

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      st.resizing = true;
      st.startY = e.clientY;
      st.startScale = st.scale;
      stage.classList.add('isVideoResizing');
    });
    handle.addEventListener('pointermove', (e) => {
      if (!st.resizing) return;
      e.preventDefault();
      e.stopPropagation();
      st.scale = st.startScale + (st.startY - e.clientY) / 180;
      apply();
    });
    const stopResize = (e) => {
      st.resizing = false;
      stage.classList.remove('isVideoResizing');
      e?.stopPropagation?.();
    };
    handle.addEventListener('pointerup', stopResize);
    handle.addEventListener('pointercancel', stopResize);

    stage.addEventListener('wheel', (e) => {
      if (!stage.contains(e.target)) return;
      e.preventDefault();
      st.scale += e.deltaY < 0 ? 0.08 : -0.08;
      apply();
    }, { passive: false });

    handle.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      st.scale = 1; st.x = 0; st.y = 0; apply();
    });
  }

  function scan() { document.querySelectorAll('.videoStage').forEach(setup); }
  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', scan);
  scan();
})();
