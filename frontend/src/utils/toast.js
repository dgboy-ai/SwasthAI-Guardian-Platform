/**
 * Gorgeous, self-contained toast notification utility for SwasthAI Guardian.
 * Injects clean, Tailwind-styled floating notifications into the DOM.
 */
export function showToast(message, type = 'success') {
  const containerId = 'swasthai-toast-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  
  // Vibrant, tailored HSL colors matching the dashboard themes
  const bgClass = type === 'error' 
    ? 'bg-rose-600 border-rose-500 text-white' 
    : type === 'info'
    ? 'bg-blue-600 border-blue-500 text-white'
    : 'bg-emerald-600 border-emerald-500 text-white';

  toast.className = `px-5 py-4 ${bgClass} font-inter font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto cursor-pointer select-none`;
  
  const icon = type === 'error' ? '⚠️' : type === 'info' ? '⚡' : '✓';
  toast.innerHTML = `
    <span class="text-sm leading-none">${icon}</span>
    <span class="leading-relaxed flex-1">${message}</span>
  `;

  toast.onclick = () => {
    toast.remove();
  };

  container.appendChild(toast);

  // Auto-dismiss after 4.5 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2', 'transition-all', 'duration-500');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 500);
  }, 4500);
}
