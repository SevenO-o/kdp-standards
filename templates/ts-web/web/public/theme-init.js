// External script so the template's script-src 'self' CSP remains unchanged.
try {
  const theme = localStorage.getItem('kdp.ui.theme.v1') === 'dark' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
} catch {
  document.documentElement.style.colorScheme = 'light';
}
