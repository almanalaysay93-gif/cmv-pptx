(() => {
  const dialog = document.getElementById('lightbox');
  const stage = document.getElementById('lb-stage');
  const count = document.getElementById('lb-count');
  const closeBtn = dialog.querySelector('.lb-close');
  const prevBtn = dialog.querySelector('.lb-prev');
  const nextBtn = dialog.querySelector('.lb-next');

  // Every photo and video in deck order, so the viewer can step through them.
  const media = Array.from(document.querySelectorAll('.cell img, .cell video'));
  let index = 0;

  function show(i) {
    index = (i + media.length) % media.length;
    const source = media[index];
    stage.textContent = '';
    if (source.tagName === 'VIDEO') {
      const v = document.createElement('video');
      v.src = source.currentSrc || source.getAttribute('src');
      v.poster = source.getAttribute('poster') || '';
      v.controls = true;
      v.autoplay = true;
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      stage.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = source.getAttribute('src');
      img.alt = source.getAttribute('alt') || '';
      stage.appendChild(img);
    }
    count.textContent = `${index + 1} / ${media.length}`;
  }

  function open(i) {
    show(i);
    if (!dialog.open) dialog.showModal();
    closeBtn.focus();
  }

  // Open from any photo, by mouse, Enter or Space.
  document.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const i = media.indexOf(cell.querySelector('img, video'));
    if (i >= 0) open(i);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const cell = e.target.closest && e.target.closest('.cell');
    if (!cell) return;
    e.preventDefault();
    const i = media.indexOf(cell.querySelector('img, video'));
    if (i >= 0) open(i);
  });

  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));
  closeBtn.addEventListener('click', () => dialog.close());

  // Click on the empty backdrop closes the viewer.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target === stage) dialog.close();
  });

  // Arrow keys step through images while the viewer is open.
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
  });

  // Stop any video when the viewer closes.
  dialog.addEventListener('close', () => { stage.textContent = ''; });
})();
