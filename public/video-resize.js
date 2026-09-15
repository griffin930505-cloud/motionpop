(() => {
  const state = new WeakMap();

  function setup(stage) {
    if (stage.dataset.videoResizeReady === '1') return;
    const video = stage.querySelector('video.cropMedia');
    if (!video) return;
    stage.dataset.videoResizeReady = '1';
    state.set(stage, { scale: 1, resizing: false, startY: 0, startScale: 1 });

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'videoResizeHandle';
    handle.title = '드래그해서 영상 크기 조절';
    handle.setAttribute('aria-label', '영상 크기 조절');
    handle.innerHTML = '↘';
    stage.appendChild(handle);

    const badge = document.createElement('div');
    badge.className = 'videoScaleBadge';
    badge.textContent = '크기 100%';
    stage.appendChild(badge);

    const apply = (scale) => {
      const s = Math.max(1, Math.min(3, scale));
      const st = state.get(stage);
      if (st) st.scale = s;
      video.style.scale = String(s);
      video.style.transformOrigin = 'center center';
      badge.textContent = `크기 ${Math.round(s * 100)}%`;
      stage.dataset.videoScale = String(s);
    };

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      const st = state.get(stage);
      if (!st) return;
      st.resizing = true;
      st.startY = e.clientY;
      st.startScale = st.scale;
      stage.classList.add('isVideoResizing');
    });

    handle.addEventListener('pointermove', (e) => {
      const st = state.get(stage);
      if (!st?.resizing) return;
      e.preventDefault();
      e.stopPropagation();
      apply(st.startScale + (st.startY - e.clientY) / 180);
    });

    const stop = (e) => {
      const st = state.get(stage);
      if (st) st.resizing = false;
      stage.classList.remove('isVideoResizing');
      e?.stopPropagation?.();
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);

    stage.addEventListener('wheel', (e) => {
      if (!stage.contains(e.target)) return;
      e.preventDefault();
      const st = state.get(stage);
      if (!st) return;
      apply(st.scale + (e.deltaY < 0 ? 0.08 : -0.08));
    }, { passive: false });

    handle.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      apply(1);
    });
  }

  function scan() {
    document.querySelectorAll('.videoStage').forEach(setup);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', scan);
  scan();
})();
