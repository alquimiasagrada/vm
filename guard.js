// Bloqueo de clic derecho / atajos de devtools — se carga antes
// que GSAP a propósito, para actuar lo antes posible.
(function () {
// Bloqueo del clic derecho, del arrastre de imágenes y de los atajos de
    // teclado más comunes para abrir las herramientas de desarrollador.
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => {
      const tag = e.target.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') e.preventDefault();
    });
    document.addEventListener('keydown', (e) => {
      const key = e.key;
      const blocked =
        key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key)) ||
        (e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key)) ||
        (e.ctrlKey && ['U', 'u'].includes(key)) ||
        (e.metaKey && ['U', 'u'].includes(key));
      if (blocked) e.preventDefault();
    });
})();
