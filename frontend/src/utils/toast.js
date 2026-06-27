/**
 * Gorgeous, self-contained toast notification utility for SwasthAI Guardian.
 * Injects clean, Tailwind-styled floating notifications into the DOM.
 */
const ICONS = {
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>',
  error: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
};

export function showToast(message, type = 'success') {
  const containerId = 'swasthai-toast-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');

  const bgClass = type === 'error'
    ? 'bg-rose-600 border-rose-500 text-white'
    : type === 'info'
    ? 'bg-blue-600 border-blue-500 text-white'
    : 'bg-emerald-600 border-emerald-500 text-white';

  toast.className = `px-5 py-4 ${bgClass} font-inter font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto cursor-pointer select-none`;

  toast.innerHTML = `
    <span class="flex items-center justify-center w-[18px] h-[18px] leading-none shrink-0">${ICONS[type] || ICONS.success}</span>
    <span class="leading-relaxed flex-1">${message}</span>
  `;

  toast.onclick = () => {
    toast.remove();
  };

  const maxVisible = 5;
  const existing = container.querySelectorAll('div');
  while (existing.length >= maxVisible) {
    existing[0].remove();
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2', 'transition-all', 'duration-500');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 500);
  }, 4500);
}
