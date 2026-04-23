/** Call before React render so first paint matches saved theme. */
export function initThemeFromStorage() {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function readStoredThemeIsDark() {
  return localStorage.getItem('theme') === 'dark'
}
