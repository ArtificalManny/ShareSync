// /src/utils/shine.js
// Binds a cursor-follow blue/indigo glow to any element with [data-shine] inside a scope.
// Usage: const unbind = bindShine(rootEl);  // return a cleanup function.
export function bindShine(scope = document) {
    const els = Array.from(scope.querySelectorAll('[data-shine]'));
    if (els.length === 0) return () => {};
  
    const onMove = (e) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width,  e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      el.style.setProperty('--sx', `${x}px`);
      el.style.setProperty('--sy', `${y}px`);
    };
  
    const onEnter = (e) => e.currentTarget.style.setProperty('--sop', '1');
    const onLeave = (e) => e.currentTarget.style.setProperty('--sop', '0');
  
    els.forEach((el) => {
      el.style.setProperty('--sop', '0');
      el.addEventListener('pointermove',  onMove);
      el.addEventListener('pointerenter', onEnter);
      el.addEventListener('pointerleave', onLeave);
    });
  
    // Clean up
    return () => {
      els.forEach((el) => {
        el.removeEventListener('pointermove',  onMove);
        el.removeEventListener('pointerenter', onEnter);
        el.removeEventListener('pointerleave', onLeave);
      });
    };
  }  