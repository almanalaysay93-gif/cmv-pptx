(() => {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  if (!button) return;

  function apply(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.textContent = dark ? 'Light' : 'Dark'; // the label names the theme the button switches to
    button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  apply(root.dataset.theme === 'dark' ? 'dark' : 'light');

  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('cmv-theme', next); } catch (e) { /* storage blocked: theme lasts for this visit */ }
  });
})();
