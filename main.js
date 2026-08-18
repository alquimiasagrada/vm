// main.js — lógica de index.html (portal, tarot, carta natal, agenda).
// Cada bloque queda en su propia IIFE para preservar el aislamiento
// de variables que tenían como <script> separados en el HTML.

(function () {
// =========================================
  // CARGA DIFERIDA DE LAS LIBRERÍAS DE CARTA NATAL
  // Son 3 librerías pesadas que la mayoría de las visitas nunca llega a
  // necesitar. Se piden recién cuando la sección entra en pantalla (con
  // margen de anticipación, para que ya estén listas cuando el usuario
  // termine de completar el formulario), o como red de seguridad justo
  // antes de calcular la carta si por algún motivo todavía no cargaron.
  (function () {
    let natalLibsPromise = null;

    window.loadNatalLibraries = function () {
      if (natalLibsPromise) return natalLibsPromise;
      const urls = [
        'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js',
        'https://cdn.jsdelivr.net/npm/tz-lookup@6.1.25/tz.js',
        'https://cdn.jsdelivr.net/npm/luxon@3.7.2/build/global/luxon.min.js'
      ];
      natalLibsPromise = Promise.all(urls.map(src => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error('No se pudo cargar ' + src));
        document.body.appendChild(s);
      })));
      return natalLibsPromise;
    };

    const natalSection = document.getElementById('carta-natal');
    if (natalSection && 'IntersectionObserver' in window) {
      const natalObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            window.loadNatalLibraries();
            natalObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '600px 0px' });
      natalObserver.observe(natalSection);
    } else if (natalSection) {
      // Navegadores sin soporte de IntersectionObserver: cargamos directo.
      window.loadNatalLibraries();
    }
  })();
})();

(function () {
const audio = document.getElementById('bg-audio');
    audio.volume = 0.5;
    let isPlaying = false;

    // Al tocar el nombre de marca en el header, volver al hero (arriba del todo)
    const brandHomeLink = document.getElementById('brand-home-link');
    if (brandHomeLink) {
      brandHomeLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    function togglePlay() {
      const playIcon = document.getElementById('playIcon');
      const playerContainer = document.getElementById('musicPlayerContainer');

      if (isPlaying) {
        audio.pause();
        playIcon.textContent = '▶';
        playerContainer.classList.remove('playing');
        isPlaying = false;
      } else {
        audio.play().then(() => {
          playIcon.textContent = '❚❚';
          playerContainer.classList.add('playing');
          isPlaying = true;
        }).catch(error => {
          console.log("El navegador bloqueó la reproducción automática:", error);
        });
      }
    }
    // Expuesta a window: el botón la llama vía onclick="togglePlay()" inline
    // en el HTML, y ese atributo solo puede ver funciones globales — al
    // quedar togglePlay dentro de esta IIFE, sin esta línea el botón
    // tiraría "togglePlay is not defined" al primer clic.
    window.togglePlay = togglePlay;

    // Efecto Typewriter (Escribir texto fluido)
    const textToType = "Terapias Holísticas\nTerapeuta, facilitadora\nIvana I. Lamberti";
    const typewriterElement = document.getElementById('typewriter-text');
    let charIndex = 0;

    function typeWriter() {
      if (charIndex < textToType.length) {
        const char = textToType.charAt(charIndex);
        if (char === '\n') {
          typewriterElement.innerHTML += '<br>';
        } else {
          typewriterElement.innerHTML += char;
        }
        charIndex++;
        setTimeout(typeWriter, 45); // Velocidad de tipeo
      }
    }

    // Iniciar el efecto máquina de escribir al cargar la página
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(typeWriter, 600);
    });

    // Parallax suave de las capas de estrellas según el scroll
    const parallax1 = document.getElementById('parallax-1');
    const parallax2 = document.getElementById('parallax-2');
    let parallaxTicking = false;

    function updateParallax() {
      const y = window.scrollY;
      parallax1.style.transform = `translateY(${y * 0.05}px)`;
      parallax2.style.transform = `translateY(${y * 0.1}px)`;
      parallaxTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!parallaxTicking) {
        requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    }, { passive: true });

    gsap.registerPlugin(ScrollTrigger);

    const items = document.querySelectorAll('.therapy-item');
    const images = document.querySelectorAll('.portal-img');
    const bgMain = document.getElementById('main-bg');
    const bgMainTint = document.getElementById('main-bg-tint');
    const playerContainer = document.getElementById('musicPlayerContainer');
    const playBtn = document.getElementById('playBtn');
    const eqBars = document.querySelectorAll('.dynamic-eq');
    const MOBILE_QUERY = window.matchMedia('(max-width: 960px)');

    // El fondo cósmico (.cosmic-bg, pantalla completa y fixed) trae de
    // estilos.css una transition de "background" de 1.2s — animar el
    // gradiente en sí es carísimo (interpola y repinta toda la pantalla
    // en cada frame). Desactivamos esa transición en la capa base y la
    // reemplazamos por un crossfade con la capa #main-bg-tint: el
    // gradiente nuevo se aplica instantáneo ahí (invisible, opacity:0) y
    // se desvanece con opacity — eso sí lo puede resolver la GPU casi
    // gratis, sin repintar el gradiente en cada frame.
    if (bgMain) bgMain.style.transition = 'none';
    let bgFadeTimer = null;
    function setCosmicBackground(gradientCSS) {
      if (!bgMain) return;
      if (!bgMainTint) { bgMain.style.background = gradientCSS; return; }
      bgMainTint.style.background = gradientCSS;
      bgMainTint.style.opacity = '1';
      clearTimeout(bgFadeTimer);
      bgFadeTimer = setTimeout(() => {
        bgMain.style.background = gradientCSS;
        bgMainTint.style.opacity = '0';
      }, 1050);
    }

    // En mobile, el portal circular (.visual-col) se reubica físicamente
    // dentro de #mobileCarouselStage (arriba del carrusel) para que
    // portal + tarjeta + puntitos formen un único bloque de una
    // pantalla completa y centrada, sin que nada quede afuera. En
    // desktop vuelve a su lugar original: columna sticky junto al texto.
    const textCol = document.querySelector('.text-col');
    const visualCol = document.querySelector('.visual-col');
    const mobileCarouselStage = document.getElementById('mobileCarouselStage');

    function placePortalForViewport() {
      if (!visualCol || !mobileCarouselStage || !textCol) return;
      if (MOBILE_QUERY.matches) {
        mobileCarouselStage.prepend(visualCol);
      } else {
        textCol.insertAdjacentElement('afterend', visualCol);
      }
    }
    placePortalForViewport();
    if (MOBILE_QUERY.addEventListener) {
      MOBILE_QUERY.addEventListener('change', placePortalForViewport);
    }

    // En mobile las 7 tarjetas viven una al lado de la otra dentro de un
    // carrusel horizontal (misma altura de página para las 7), así que
    // un ScrollTrigger de scroll VERTICAL no sirve para saber cuál está
    // centrada — de eso se encarga el bloque "carrusel mobile" más abajo,
    // que llama a esta misma activateSection() al deslizar.
    if (!MOBILE_QUERY.matches) {
      items.forEach((item, index) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top center",
          end: "bottom center",
          onEnter: () => activateSection(index, item),
          onEnterBack: () => activateSection(index, item)
        });
      });
    }

    // El bloque hero muestra el logo en el portal mientras está en pantalla,
    // antes de que el scroll llegue a la primera terapia
    const heroBlock = document.querySelector('.hero-block');
    if (heroBlock) {
      ScrollTrigger.create({
        trigger: heroBlock,
        start: "top center",
        end: "bottom center",
        onEnter: activateHero,
        onEnterBack: activateHero
      });
    }

    // onEnter/onEnterBack de ScrollTrigger solo disparan cuando el scroll
    // CRUZA el punto de inicio del trigger. Como el hero ya está a la
    // vista apenas carga la página (sin necesidad de scrollear), nunca se
    // dispara solo — hay que activarlo a mano una vez al cargar.
    activateHero();

    function activateHero() {
      items.forEach(el => el.classList.remove('active'));

      // En mobile el hero ya tiene su propia fotito circular separada
      // (.hero-block .item-photo) — el portal de categorías no debe
      // tocarse desde acá, así nunca "vuelve" a mostrar el logo mientras
      // el carrusel entra o sale de pantalla. En desktop el portal sigue
      // siendo compartido con el hero, como siempre.
      if (!MOBILE_QUERY.matches) {
        images.forEach(img => img.classList.remove('active'));
        const logoImg = document.getElementById('img-logo');
        if (logoImg) logoImg.classList.add('active');
      }

      setCosmicBackground(`radial-gradient(circle at 12% 30%, rgba(76, 155, 163, 0.28) 0%, transparent 45%), radial-gradient(circle at 88% 28%, rgba(224, 178, 90, 0.28) 0%, transparent 50%), var(--bg-base)`);

      playerContainer.style.borderColor = 'var(--gold-dim)';
      playerContainer.style.boxShadow = '0 10px 30px rgba(28, 49, 68, 0.12), 0 0 20px rgba(201, 152, 47, 0.15)';
      playBtn.style.background = 'var(--gold)';
      playBtn.style.boxShadow = '0 0 15px rgba(201, 152, 47, 0.4)';
      eqBars.forEach(bar => bar.style.background = 'var(--gold)');
    }

    // Fade-up: revela título, texto, beneficios y botón al entrar en pantalla
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

    items.forEach(item => revealObserver.observe(item));

    function activateSection(index, currentItem) {
      items.forEach(el => el.classList.remove('active'));
      currentItem.classList.add('active');

      images.forEach(img => img.classList.remove('active'));
      const targetImg = document.getElementById(`img-${index}`);
      if (targetImg) {
        // La imagen arranca sin src (solo data-src) para no descargar las
        // 6 fotos de entrada — recién acá, la primera vez que esta
        // sección se activa, se dispara la petición real.
        if (targetImg.dataset.src && !targetImg.getAttribute('src')) {
          targetImg.src = targetImg.dataset.src;
        }
        targetImg.classList.add('active');

        // Precarga silenciosa de las fotos vecinas (anterior/siguiente):
        // para cuando el usuario deslice a la próxima tarjeta, esa foto
        // ya está en caché y no espera la descarga a mitad del swipe.
        [index - 1, index + 1].forEach(i => {
          const neighborImg = document.getElementById(`img-${i}`);
          if (neighborImg && neighborImg.dataset.src && !neighborImg.getAttribute('src')) {
            neighborImg.src = neighborImg.dataset.src;
          }
        });
      }

      // Cambiar fondo cósmico: mantiene el velo de acuarela teal/dorado de marca
      // y suma un matiz sutil del color de la terapia activa
      const newColor = currentItem.getAttribute('data-color');
      setCosmicBackground(`radial-gradient(circle at 60% 35%, ${newColor}30 0%, transparent 50%), radial-gradient(circle at 12% 30%, rgba(76, 155, 163, 0.28) 0%, transparent 45%), radial-gradient(circle at 88% 28%, rgba(224, 178, 90, 0.28) 0%, transparent 50%), var(--bg-base)`);

      // Cambiar colores dinámicos del reproductor según la sección
      const accentContextColor = currentItem.getAttribute('data-accent');
      playerContainer.style.borderColor = accentContextColor + '40';
      playerContainer.style.boxShadow = `0 10px 30px rgba(28, 49, 68, 0.12), 0 0 20px ${accentContextColor}20`;
      playBtn.style.background = accentContextColor;
      playBtn.style.boxShadow = `0 0 15px ${accentContextColor}66`;
      eqBars.forEach(bar => bar.style.background = accentContextColor);
    }

    // ---- Carrusel mobile: el portal queda fijo arriba y solo cambia su
    // imagen/color según qué tarjeta quedó centrada al deslizar. En
    // desktop este bloque no hace nada (el carrusel no existe como tal,
    // .therapy-carousel es un wrapper invisible). ----
    const therapyCarousel = document.getElementById('therapyCarousel');
    const carouselDots = document.querySelectorAll('#therapyDots .dot');

    function setActiveDot(index) {
      carouselDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    let lastCarouselIndex = null;

    function updateCarouselFromScroll(force) {
      if (!therapyCarousel) return;
      const containerRect = therapyCarousel.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      let closestItem = null;
      let closestIndex = 0;
      let closestDist = Infinity;
      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const dist = Math.abs((rect.left + rect.width / 2) - containerCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestItem = item;
          closestIndex = index;
        }
      });
      // Solo repintar (fondo, reproductor, punto activo) cuando la tarjeta
      // centrada realmente cambió — evita repaints innecesarios en cada
      // frame de scroll mientras se está deslizando, que era la causa de
      // los bajones de FPS al recorrer el carrusel. `force` se usa para
      // resincronizar igual, por ejemplo al volver del hero (que puso el
      // logo en el portal) aunque el índice "centrado" no haya cambiado.
      if (closestItem && (force || closestIndex !== lastCarouselIndex)) {
        lastCarouselIndex = closestIndex;
        activateSection(closestIndex, closestItem);
        setActiveDot(closestIndex);
      }
    }

    if (therapyCarousel) {
      let carouselTicking = false;
      therapyCarousel.addEventListener('scroll', () => {
        if (!MOBILE_QUERY.matches || carouselTicking) return;
        carouselTicking = true;
        requestAnimationFrame(() => {
          updateCarouselFromScroll();
          carouselTicking = false;
        });
      }, { passive: true });

      carouselDots.forEach((dot) => {
        dot.addEventListener('click', () => {
          const target = items[Number(dot.dataset.index)];
          if (target) target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
      });

      // Estado inicial del portal y los puntitos apenas carga, si ya
      // estamos en mobile: debe arrancar en la primera tarjeta
      // (Constelaciones Familiares), no en el logo del hero.
      if (MOBILE_QUERY.matches) updateCarouselFromScroll(true);
    }

    // Agendar Sesión: el botón siempre lleva directo a WhatsApp.
    // Si la persona ya eligió una terapia puntual, el mensaje viene personalizado;
    // si llega directo a esta sección, se envía un mensaje genérico.
    const whatsappNumber = '5493535654858';
    const whatsappCta = document.getElementById('whatsapp-cta');
    const whatsappCtaLabel = document.getElementById('whatsapp-cta-label');
    const agendaSelected = document.getElementById('agenda-selected');

    function setWhatsappMessage(therapyName) {
      const message = therapyName
        ? `Hola! Quiero agendar una sesión de ${therapyName}.`
        : 'Hola! Quiero agendar una sesión.';
      whatsappCta.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    }

    setWhatsappMessage(null);

    document.querySelectorAll('.therapy-item .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const therapyItem = btn.closest('.therapy-item');
        const therapyName = therapyItem.querySelector('h2').textContent.trim();
        setWhatsappMessage(therapyName);
        whatsappCtaLabel.textContent = 'Escribinos por WhatsApp';
        agendaSelected.textContent = `Terapia seleccionada: ${therapyName}`;
        agendaSelected.classList.add('visible');
      });
    });
})();

(function () {
// =========================================
  // CALCULADORA DE CARTA NATAL
  // =========================================
  (function () {
    const ZODIAC_SIGNS = [
      { name: 'Aries', glyph: '♈', slug: 'aries' }, { name: 'Tauro', glyph: '♉', slug: 'tauro' }, { name: 'Géminis', glyph: '♊', slug: 'geminis' },
      { name: 'Cáncer', glyph: '♋', slug: 'cancer' }, { name: 'Leo', glyph: '♌', slug: 'leo' }, { name: 'Virgo', glyph: '♍', slug: 'virgo' },
      { name: 'Libra', glyph: '♎', slug: 'libra' }, { name: 'Escorpio', glyph: '♏', slug: 'escorpio' }, { name: 'Sagitario', glyph: '♐', slug: 'sagitario' },
      { name: 'Capricornio', glyph: '♑', slug: 'capricornio' }, { name: 'Acuario', glyph: '♒', slug: 'acuario' }, { name: 'Piscis', glyph: '♓', slug: 'piscis' }
    ];

    const PLANETS = [
      { key: 'Sun', label: 'Sol', glyph: '☉' },
      { key: 'Moon', label: 'Luna', glyph: '☾' },
      { key: 'Mercury', label: 'Mercurio', glyph: '☿' },
      { key: 'Venus', label: 'Venus', glyph: '♀' },
      { key: 'Mars', label: 'Marte', glyph: '♂' },
      { key: 'Jupiter', label: 'Júpiter', glyph: '♃' },
      { key: 'Saturn', label: 'Saturno', glyph: '♄' },
      { key: 'Uranus', label: 'Urano', glyph: '♅' },
      { key: 'Neptune', label: 'Neptuno', glyph: '♆' },
      { key: 'Pluto', label: 'Plutón', glyph: '♇' }
    ];

    function toRad(d) { return d * Math.PI / 180; }
    function norm360(d) { return ((d % 360) + 360) % 360; }
    function toDegNorm(r) { return norm360(r * 180 / Math.PI); }

    function signOf(lonDeg) {
      const n = norm360(lonDeg);
      const idx = Math.floor(n / 30);
      return { sign: ZODIAC_SIGNS[idx], deg: n % 30 };
    }

    function calcMC(ramcDeg, oblDeg) {
      const ramc = toRad(ramcDeg), obl = toRad(oblDeg);
      return toDegNorm(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(obl)));
    }
    function calcAsc(ramcDeg, oblDeg, latDeg) {
      const ramc = toRad(ramcDeg), obl = toRad(oblDeg), lat = toRad(latDeg);
      return toDegNorm(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(obl) + Math.tan(lat) * Math.sin(obl))));
    }

    async function geocode(place) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(place)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      if (!res.ok) throw new Error('No se pudo geolocalizar el lugar.');
      const data = await res.json();
      if (!data || !data.length) throw new Error('No encontramos esa ciudad. Probá escribiendo "Ciudad, País".');

      // Nominatim puede devolver calles, parques o monumentos junto con ciudades reales.
      // Priorizamos resultados que sean lugares poblados (ciudad, pueblo, localidad, etc.)
      // y descartamos calles/parques/edificios, aunque tengan un nombre parecido a lo buscado.
      const PREFERRED_TYPES = ['city', 'town', 'village', 'municipality', 'hamlet', 'county', 'state', 'administrative'];
      const EXCLUDED_CLASSES = ['highway', 'leisure', 'amenity', 'shop', 'tourism', 'building', 'historic'];

      const ranked = [...data].sort((a, b) => {
        const scoreOf = (r) => {
          const type = r.addresstype || r.type || '';
          const cls = r.class || '';
          let score = parseFloat(r.importance) || 0;
          if (PREFERRED_TYPES.includes(type)) score += 2;
          if (EXCLUDED_CLASSES.includes(cls)) score -= 3;
          return score;
        };
        return scoreOf(b) - scoreOf(a);
      });

      const best = ranked[0];
      return { lat: parseFloat(best.lat), lon: parseFloat(best.lon), label: best.display_name };
    }

    function computeChart({ year, month, day, hour, minute, lat, lon }) {
      const tzName = tzlookup(lat, lon);
      const { DateTime } = luxon;
      const localDT = DateTime.fromObject({ year, month, day, hour, minute }, { zone: tzName });
      if (!localDT.isValid) throw new Error('Fecha u hora inválida.');
      const utcDT = localDT.toUTC();

      const Astronomy = window.Astronomy;
      const time = Astronomy.MakeTime(utcDT.toJSDate());

      const planets = PLANETS.map(p => {
        const vec = Astronomy.GeoVector(Astronomy.Body[p.key], time, true);
        const ecl = Astronomy.Ecliptic(vec);
        return { ...p, lon: norm360(ecl.elon) };
      });

      // Hora sideral de Greenwich (horas) -> Hora sideral local en grados (RAMC)
      const gstHours = Astronomy.SiderealTime(time);
      const ramc = norm360(gstHours * 15 + lon);

      // Oblicuidad de la eclíptica para la fecha (fórmula estándar de baja variación)
      const T = (utcDT.toMillis() / 86400000 - 10957.5) / 36525;
      const obliquity = 23.4392911 - 0.0130042 * T;

      const asc = calcAsc(ramc, obliquity, lat);
      const mc = calcMC(ramc, obliquity);

      // Sistema de Casas Iguales: cada casa ocupa 30° a partir del Ascendente
      const houseCusps = [];
      for (let i = 0; i < 12; i++) houseCusps.push(norm360(asc + i * 30));

      function houseOf(lonDeg) {
        return Math.floor(norm360(lonDeg - asc) / 30) + 1;
      }

      return {
        tzName,
        planets: planets.map(p => ({ ...p, house: houseOf(p.lon) })),
        asc, mc, houseCusps
      };
    }

    function renderWheel(chart) {
      const size = 400, cx = size / 2, cy = size / 2;
      const rOuter = 190, rSignRing = 165, rHouseLine = 148, rPlanet = 115;

      // El Ascendente se ubica a la izquierda (convención estándar) y el
      // zodíaco avanza en sentido antihorario a medida que crece la longitud eclíptica
      function point(lonDeg, radius) {
        const angle = toRad(180 + (lonDeg - chart.asc));
        return { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) };
      }

      let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;

      // ---- IMAGEN DE FONDO: SIGNO SOLAR (sin imágenes todavía) ----
      // El fondo de la rueda muestra la imagen del signo donde cae el Sol
      // en la carta. Se escala siempre a partir de rOuter, así que se
      // adapta automáticamente si en algún momento cambia el tamaño de la
      // rueda. Cuando subas los archivos reales, colocalos en
      // assets/zodiac/{slug}.png (aries, tauro, geminis, cancer, leo,
      // virgo, libra, escorpio, sagitario, capricornio, acuario, piscis)
      // — no hace falta tocar este código: si el archivo no existe
      // todavía, la imagen simplemente no se muestra.
      const sun = chart.planets.find(p => p.key === 'Sun');
      const sunSign = signOf(sun.lon);

      svg += `
        <image
          href="/assets/zodiac/${sunSign.sign.slug}.png"
          x="${cx - rOuter}"
          y="${cy - rOuter}"
          width="${rOuter * 2}"
          height="${rOuter * 2}"
          preserveAspectRatio="xMidYMid meet"
          opacity="0.22"
          onerror="console.error('No se pudo cargar la imagen del signo solar:', '/assets/zodiac/${sunSign.sign.slug}.png')"
        />
      `;

      svg += `<circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="var(--gold-dim)" stroke-width="1.5"/>`;
      svg += `<circle cx="${cx}" cy="${cy}" r="${rSignRing}" fill="none" stroke="var(--gold-dim)" stroke-width="1"/>`;
      svg += `<circle cx="${cx}" cy="${cy}" r="${rHouseLine}" fill="none" stroke="rgba(28,49,68,0.12)" stroke-width="1"/>`;

      for (let i = 0; i < 12; i++) {
        const lon = i * 30;
        const p1 = point(lon, rOuter);
        const p2 = point(lon, rHouseLine);
        svg += `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="var(--gold-dim)" stroke-width="1"/>`;
        const mid = point(lon + 15, rSignRing + 14);
        svg += `<text x="${mid.x.toFixed(1)}" y="${mid.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="15" fill="var(--gold)">${ZODIAC_SIGNS[i].glyph}</text>`;
      }

      chart.houseCusps.forEach((cusp, i) => {
        const p1 = point(cusp, rHouseLine);
        const isAngular = (i === 0 || i === 3 || i === 6 || i === 9);
        svg += `<line x1="${cx}" y1="${cy}" x2="${p1.x.toFixed(1)}" y2="${p1.y.toFixed(1)}" stroke="rgba(28,49,68,${isAngular ? 0.3 : 0.12})" stroke-width="${isAngular ? 1.4 : 0.7}"/>`;
        const numPt = point(cusp + 15, rHouseLine - 16);
        svg += `<text x="${numPt.x.toFixed(1)}" y="${numPt.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="rgba(92,109,126,0.75)">${i + 1}</text>`;
      });

      const ascPt = point(chart.asc, rOuter + 14);
      svg += `<text x="${ascPt.x.toFixed(1)}" y="${ascPt.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="var(--ink)">ASC</text>`;
      const mcPt = point(chart.mc, rOuter + 14);
      svg += `<text x="${mcPt.x.toFixed(1)}" y="${mcPt.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="var(--ink)">MC</text>`;

      const sorted = [...chart.planets].sort((a, b) => a.lon - b.lon);
      const placed = [];
      sorted.forEach(p => {
        let radius = rPlanet;
        for (const other of placed) {
          let diff = Math.abs(p.lon - other.lon);
          if (diff > 180) diff = 360 - diff;
          if (diff < 6) radius -= 16;
        }
        placed.push({ lon: p.lon, radius });
        const pt = point(p.lon, radius);
        svg += `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="10" fill="var(--bg-base)" stroke="var(--teal)" stroke-width="1"/>`;
        svg += `<text x="${pt.x.toFixed(1)}" y="${pt.y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="12" fill="var(--teal)">${p.glyph}</text>`;
      });

      svg += `<circle cx="${cx}" cy="${cy}" r="3" fill="var(--gold)"/>`;
      svg += `</svg>`;
      return svg;
    }

    function renderLegend(chart) {
      const rows = chart.planets.map(p => {
        const { sign, deg } = signOf(p.lon);
        return `<div class="natal-legend-item">
          <span class="natal-legend-planet"><span class="glyph">${p.glyph}</span> ${p.label}</span>
          <span class="natal-legend-detail">${deg.toFixed(1)}° ${sign.glyph} ${sign.name} · Casa ${p.house}</span>
        </div>`;
      }).join('');
      const ascSign = signOf(chart.asc);
      const mcSign = signOf(chart.mc);
      return `<p class="natal-legend-heading">Puntos angulares</p>
        <div class="natal-legend-item">
          <span class="natal-legend-planet"><span class="glyph">↑</span> Ascendente</span>
          <span class="natal-legend-detail">${ascSign.deg.toFixed(1)}° ${ascSign.sign.glyph} ${ascSign.sign.name}</span>
        </div>
        <div class="natal-legend-item">
          <span class="natal-legend-planet"><span class="glyph">⟟</span> Medio Cielo</span>
          <span class="natal-legend-detail">${mcSign.deg.toFixed(1)}° ${mcSign.sign.glyph} ${mcSign.sign.name}</span>
        </div>
        <p class="natal-legend-heading" style="margin-top:1.2rem;">Planetas</p>
        ${rows}`;
    }

    const form = document.getElementById('natal-form');
    const statusEl = document.getElementById('natal-status');
    const resultEl = document.getElementById('natal-result');
    const wheelWrap = document.getElementById('natal-wheel-wrap');
    const legendEl = document.getElementById('natal-legend');
    const submitBtn = document.getElementById('natal-submit');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusEl.classList.remove('error');
        statusEl.textContent = 'Ubicando tu lugar de nacimiento...';
        resultEl.classList.remove('visible');
        submitBtn.disabled = true;

        try {
          // Red de seguridad: si por scroll rápido o un link directo a
          // #carta-natal las librerías todavía no terminaron de cargar,
          // esperamos acá (normalmente ya están listas y esto es instantáneo).
          if (window.loadNatalLibraries) {
            await window.loadNatalLibraries();
          }

          const dateVal = document.getElementById('natal-date').value;
          const timeVal = document.getElementById('natal-time').value;
          const placeVal = document.getElementById('natal-place').value.trim();
          if (!dateVal || !timeVal || !placeVal) throw new Error('Completá los tres campos.');

          const [year, month, day] = dateVal.split('-').map(Number);
          const [hour, minute] = timeVal.split(':').map(Number);

          const geo = await geocode(placeVal);
          statusEl.textContent = 'Calculando posiciones planetarias...';

          const chart = computeChart({ year, month, day, hour, minute, lat: geo.lat, lon: geo.lon });

          wheelWrap.innerHTML = renderWheel(chart);
          legendEl.innerHTML = renderLegend(chart);
          resultEl.classList.add('visible');
          statusEl.textContent = `Carta calculada para ${geo.label.split(',').slice(0, 2).join(',')} · zona horaria ${chart.tzName}`;
        } catch (err) {
          statusEl.classList.add('error');
          statusEl.textContent = err.message || 'Ocurrió un error al calcular la carta.';
        } finally {
          submitBtn.disabled = false;
        }
      });
    }
  })();
})();

(function () {
// Los 22 Arcanos Mayores, con significado derecho e invertido.
    // "image" apunta a ./assets/astrales/{slug}.jpg — subí ahí los archivos
    // con ese mismo nombre exacto (y un dorso común en dorso.jpg).
    const TAROT_ARCANA = [
      { id: 0, numeral: '0', name: 'El Loco',
        upright: { meaning: 'Comienzos, espontaneidad, fe en lo desconocido', energy: 'constructiva', description: 'Un nuevo capítulo se abre ante vos. Es momento de dar el primer paso con el corazón liviano, aunque no tengas todas las respuestas.' },
        reversed: { meaning: 'Imprudencia, dudas, miedo a arriesgar', energy: 'desafiante', description: 'Algo te frena antes de empezar. Quizás estés actuando sin pensar, o paralizada por el miedo a equivocarte — ambos extremos piden equilibrio.' } },
      { id: 1, numeral: 'I', name: 'El Mago',
        upright: { meaning: 'Voluntad, manifestación, recursos propios', energy: 'constructiva', description: 'Tenés todas las herramientas que necesitás al alcance de la mano. Es momento de transformar la intención en acción concreta.' },
        reversed: { meaning: 'Manipulación, potencial desaprovechado', energy: 'desafiante', description: 'Tus talentos están ahí, pero algo los está bloqueando — puede ser inseguridad, dispersión, o el uso indebido del propio poder.' } },
      { id: 2, numeral: 'II', name: 'La Sacerdotisa',
        upright: { meaning: 'Intuición, misterio, sabiduría interior', energy: 'constructiva', description: 'Hay respuestas que no se encuentran razonando, sino escuchando el silencio. Confiá en lo que tu intuición te viene diciendo.' },
        reversed: { meaning: 'Secretos, desconexión de una misma', energy: 'desafiante', description: 'Estás ignorando una voz interior que insiste. Puede ser momento de hacer silencio y volver a escucharte.' } },
      { id: 3, numeral: 'III', name: 'La Emperatriz',
        upright: { meaning: 'Abundancia, fertilidad, conexión con la naturaleza', energy: 'constructiva', description: 'Un momento fértil de creación y crecimiento. Permitite recibir y disfrutar de lo que estás gestando.' },
        reversed: { meaning: 'Bloqueo creativo, descuido propio', energy: 'desafiante', description: 'Te estás postergando a vos misma. Revisá si estás cuidando tu energía tanto como cuidás a los demás.' } },
      { id: 4, numeral: 'IV', name: 'El Emperador',
        upright: { meaning: 'Estructura, autoridad, estabilidad', energy: 'constructiva', description: 'Es tiempo de poner orden y sostener tu palabra. La disciplina de hoy construye la seguridad de mañana.' },
        reversed: { meaning: 'Rigidez, control excesivo', energy: 'desafiante', description: 'El control se volvió una prisión. Quizás necesites soltar un poco de estructura para volver a fluir.' } },
      { id: 5, numeral: 'V', name: 'El Hierofante',
        upright: { meaning: 'Tradición, aprendizaje, guía espiritual', energy: 'constructiva', description: 'Un maestro, una enseñanza o una tradición tienen algo valioso para ofrecerte en este momento.' },
        reversed: { meaning: 'Cuestionamiento de creencias, rebeldía', energy: 'desafiante', description: 'Estás poniendo en duda lo que antes dabas por sentado — es una parte necesaria de encontrar tu propio camino.' } },
      { id: 6, numeral: 'VI', name: 'Los Enamorados',
        upright: { meaning: 'Unión, elección, alineación de valores', energy: 'constructiva', description: 'Una decisión importante está frente a vos. Elegí desde el corazón, en sintonía con lo que realmente valorás.' },
        reversed: { meaning: 'Desequilibrio, conflicto de valores', energy: 'desafiante', description: 'Hay una tensión entre lo que sentís y lo que hacés. Revisar tus prioridades te va a traer claridad.' } },
      { id: 7, numeral: 'VII', name: 'El Carro',
        upright: { meaning: 'Determinación, avance, victoria', energy: 'constructiva', description: 'Tenés la fuerza de voluntad para superar lo que se te presente. Mantené el rumbo con confianza.' },
        reversed: { meaning: 'Falta de dirección, dispersión', energy: 'desafiante', description: 'Sentís que vas para todos lados a la vez. Antes de acelerar, definí hacia dónde realmente querés ir.' } },
      { id: 8, numeral: 'VIII', name: 'La Justicia',
        upright: { meaning: 'Coraje, paciencia, fuerza interior serena', energy: 'constructiva', description: 'La verdadera fuerza no grita — sostiene. Enfrentás esta etapa con más templanza de la que creés tener.' },
        reversed: { meaning: 'Autoduda, agotamiento emocional', energy: 'desafiante', description: 'Te estás exigiendo de más. Un poco de compasión hacia vos misma es lo que hace falta ahora.' } },
      { id: 9, numeral: 'IX', name: 'El Ermitaño',
        upright: { meaning: 'Introspección, búsqueda interior, guía propia', energy: 'constructiva', description: 'Es momento de hacer una pausa y mirar hacia adentro. Las respuestas que buscás están en el silencio, no afuera.' },
        reversed: { meaning: 'Aislamiento excesivo, soledad no elegida', energy: 'desafiante', description: 'El retiro se volvió encierro. Quizás sea hora de volver a abrirte a los demás.' } },
      { id: 10, numeral: 'X', name: 'La Rueda de la Fortuna',
        upright: { meaning: 'Cambio, ciclos, un giro de destino', energy: 'constructiva', description: 'Algo está por moverse — un ciclo se cierra y otro comienza. Confiá en el movimiento natural de la vida.' },
        reversed: { meaning: 'Resistencia al cambio, mala racha', energy: 'desafiante', description: 'Sentís que las cosas no están de tu lado. Recordá que los ciclos siempre vuelven a girar.' } },
      { id: 11, numeral: 'XI', name: 'La Fuerza',
        upright: { meaning: 'Equilibrio, verdad, causa y efecto', energy: 'constructiva', description: 'Cada acción tiene su consecuencia. Este es un buen momento para actuar con honestidad y claridad.' },
        reversed: { meaning: 'Injusticia, decisiones evasivas', energy: 'desafiante', description: 'Algo se siente desequilibrado o poco claro. Puede ser momento de asumir una responsabilidad que venís postergando.' } },
      { id: 12, numeral: 'XII', name: 'El Colgado',
        upright: { meaning: 'Rendición, nueva perspectiva, pausa', energy: 'constructiva', description: 'A veces avanzar es soltar el control y mirar la situación desde otro ángulo. La quietud también es un camino.' },
        reversed: { meaning: 'Estancamiento, resistencia a soltar', energy: 'desafiante', description: 'Te estás aferrando a algo que ya no te sirve. Soltar no es perder, es hacer espacio.' } },
      { id: 13, numeral: 'XIII', name: 'La Muerte',
        upright: { meaning: 'Transformación, cierre, renacimiento', energy: 'constructiva', description: 'Algo en vos está terminando para dar lugar a algo nuevo. No lo temas: es parte del ciclo natural de crecer.' },
        reversed: { meaning: 'Resistencia al cierre, estancamiento', energy: 'desafiante', description: 'Hay un final que estás evitando. Cuanto más lo postergués, más cuesta el proceso de renacer.' } },
      { id: 14, numeral: 'XIV', name: 'La Templanza',
        upright: { meaning: 'Equilibrio, paciencia, integración', energy: 'constructiva', description: 'Estás encontrando el punto medio entre extremos. Seguí mezclando con calma, sin apurar el resultado.' },
        reversed: { meaning: 'Desequilibrio, excesos', energy: 'desafiante', description: 'Algo en tu vida está desbalanceado. Buscá dónde estás yendo de más, o de menos, y reencontrá el punto medio.' } },
      { id: 15, numeral: 'XV', name: 'El Diablo',
        upright: { meaning: 'Ataduras, deseo, sombra propia', energy: 'desafiante', description: 'Hay algo que te tiene atrapada — un hábito, un vínculo, un miedo. Reconocerlo ya es el primer paso para soltarlo.' },
        reversed: { meaning: 'Liberación, ruptura de cadenas', energy: 'constructiva', description: 'Estás empezando a soltar aquello que te limitaba. El poder de elegir distinto vuelve a tus manos.' } },
      { id: 16, numeral: 'XVI', name: 'La Torre',
        upright: { meaning: 'Quiebre repentino, revelación, caída de lo falso', energy: 'desafiante', description: 'Algo se derrumba para revelar lo que realmente importa. Un cambio brusco puede ser, en el fondo, una liberación.' },
        reversed: { meaning: 'Cambio evitado, crisis interna', energy: 'desafiante', description: 'Estás resistiendo un cambio que igual va a llegar. A veces es mejor dejar caer lo que ya no sostiene.' } },
      { id: 17, numeral: 'XVII', name: 'La Estrella',
        upright: { meaning: 'Esperanza, inspiración, confianza', energy: 'constructiva', description: 'Después de la tormenta, llega la calma. Esta carta te invita a volver a confiar y soñar.' },
        reversed: { meaning: 'Desesperanza, desconexión de la fe', energy: 'desafiante', description: 'Sentís que la luz se apagó un poco. Recordá que la esperanza no desaparece, solo está esperando que la mires de nuevo.' } },
      { id: 18, numeral: 'XVIII', name: 'La Luna',
        upright: { meaning: 'Intuición, sueños, lo oculto que emerge', energy: 'desafiante', description: 'No todo es lo que parece. Confiá en tu intuición para atravesar esta etapa de incertidumbre.' },
        reversed: { meaning: 'Confusión, miedos que se disipan', energy: 'constructiva', description: 'Los miedos que te venían persiguiendo empiezan a perder fuerza. La claridad está más cerca de lo que creés.' } },
      { id: 19, numeral: 'XIX', name: 'El Sol',
        upright: { meaning: 'Alegría, vitalidad, éxito', energy: 'constructiva', description: 'Un momento de luz, claridad y buena energía te acompaña. Disfrutalo con gratitud.' },
        reversed: { meaning: 'Alegría postergada, exceso de optimismo', energy: 'constructiva', description: 'La luz está ahí, aunque cueste verla. Date permiso de encontrar pequeñas alegrías, aunque el panorama no sea perfecto.' } },
      { id: 20, numeral: 'XX', name: 'El Juicio',
        upright: { meaning: 'Renacimiento, llamado interior, evaluación', energy: 'constructiva', description: 'Es tiempo de un despertar — de mirar atrás con honestidad y dar un paso hacia quien querés ser.' },
        reversed: { meaning: 'Autocrítica excesiva, dudas sobre el propio camino', energy: 'desafiante', description: 'Te estás juzgando con demasiada dureza. El cambio que buscás empieza con más compasión hacia vos misma.' } },
      { id: 21, numeral: 'XXI', name: 'El Mundo',
        upright: { meaning: 'Cumplimiento, integración, un ciclo completo', energy: 'constructiva', description: 'Un ciclo importante llega a su fin. Celebrá el camino recorrido antes de empezar el próximo.' },
        reversed: { meaning: 'Cierre pendiente, sensación de incompletitud', energy: 'desafiante', description: 'Sentís que falta algo para cerrar esta etapa. Date el tiempo que necesites, no hay que apurar los finales.' } }
    ].map(c => ({
      ...c,
      slug: c.id + '-' + c.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      image: './assets/astrales/' + c.id + '-' + c.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '.jpg'
    }));

(function () {
    const POSITIONS = [
      { key: 'pasado', label: 'Tu pasado' },
      { key: 'presente', label: 'Tu presente' },
      { key: 'futuro', label: 'Tu futuro' }
    ];

    // Frases de cierre según cuántas de las 3 cartas salieron con energía
    // "constructiva" (0 a 3). Dos variantes por caso, elegida al azar,
    // para que no se sienta siempre idéntica.
   const SYNTHESIS = {
  3: [
    'Las tres cartas te hablan en la misma dirección: es un buen momento para confiar y avanzar.',
    'Rara vez el cielo se alinea así de claro — aprovechá este impulso favorable.',
    'Hay una alineación perfecta en tu Lectura; las energías juegan a favor de lo que pensaste.',
    'Todo en este esquema indica fluidez. Es el momento ideal para tomar la iniciativa con certeza.',
    'Una lectura profundamente clara y armónica. Confiá en la dirección que estás tomando.',
    'Los caminos de tu pasado, presente y futuro se abren sin resistencia hacia la resolución.',
    'La energía que rodea tu inquietud es de plena expansión y avance sin frenos.',
    'Tenés luz verde del universo: lo que sembraste encuentra hoy un terreno fértil para prosperar.',
    'Una combinación potente que confirma que estás exactamente donde necesitás estar.',
    'Las cartas respaldan tu intención con fuerza. Avanzá sin dudas ni titubeos.',
    'El flujo de tu consulta es impecable; hay coherencia entre de dónde venís y hacia dónde vas.',
    'Sintonía total en tus tres tiempos. Mantené la fe en tu visión y actuá en consecuencia.',
    'Un mensaje de pleno respaldo: las circunstancias se acomodan a tu favor.',
    'Tu intención está alineada con un propósito mayor. Sentite en confianza para dar el paso.',
    'No hay bloqueos visibles en esta lectura. La respuesta que buscás ya está en marcha.',
    'Una secuencia luminosa que te invita a soltar los miedos y abrazar lo que viene.',
    'El panorama es sumamente auspicioso: tenés los recursos y el viento a favor.',
    'Las decisiones que tomes hoy bajo este clima astral darán frutos sólidos.',
    'Tirada de manifestación directa. Todo se articula para darte claridad y calma.',
    'Hay fuerza, dirección y resolución en tus cartas. Un ciclo muy prometedor se consolida.',
    'La energía fluye con total naturalidad; dejate llevar por este impulso positivo.',
    'Una excelente señal del universo que disipa las dudas que traías en mente.',
    'Pasado sanado, presente afianzado y futuro despejado: una lectura sumamente noble.',
    'Tus pensamientos y tus acciones encontraron hoy un punto de equilibrio perfecto.',
    'Reconocé este momento de gracia y aprovechalo para materializar tus ideas.',
    'Los arcanos muestran un camino despejado donde tus talentos serán los protagonistas.',
    'Un horizonte despejado se despliega ante tu duda; caminá con seguridad.',
    'Sincronía pura: el mapa de tus cartas refleja la mejor versión de tu proyecto.',
    'La resolución que esperás viene acompañada de paz y estabilidad duradera.',
    'No hay sombras en tu lectura hoy; aprovechá la claridad para definir tu rumbo.',
    'La sabiduría de tu recorrido pasado hoy se convierte en la llave de tu éxito futuro.',
    'Tirada expansiva: todo lo que toque tu intención bajo esta energía tiende a crecer.',
    'Tus convicciones encuentran respaldo en las cartas; seguí tu intuición sin dudar.',
    'Una corriente de prosperidad y claridad atraviesa la respuesta a tu consulta.',
    'El universo te responde con un "sí" contundente a través de esta combinación.',
    'Siente la tranquilidad de estar respaldado por una energía de concreción absoluta.',
    'Las piezas del rompecabezas encajan con soltura en tu pasado, presente y futuro.',
    'Una lectura caracterizada por la armonía interna y la fluidez en el entorno.',
    'La claridad que buscabas finalmente se hace presente de forma transparente.',
    'El tiempo trabaja a tu favor; observá cómo los acontecimientos se ordenan solos.',
    'Fuerza, luz y determinación: tres virtudes que hoy coronan tu lectura.',
    'Un escenario donde la duda no tiene lugar; confiá en el proceso que iniciaste.',
    'Las energías te acompañan para dar ese salto que venías postergando.',
    'Excelente síntesis que augura un cierre de ciclo victorioso y un gran comienzo.',
    'Caminás sobre suelo firme; lo que pensaste tiene bases reales para prosperar.',
    'Tu energía creadora está en su punto máximo; usala a tu favor hoy.',
    'Nada de lo que te preocupaba tiene peso real frente a la luz de esta lectura.',
    'Un mensaje de esperanza activa: tenés el control y el entorno te apoya.',
    'Tirada luminosa que te recuerda el inmenso potencial que tenés para resolver esto.',
    'Todo está servido para que des el paso con tranquilidad y absoluta certeza.'
  ],
  2: [
    'La balanza se inclina a tu favor, aunque hay un punto que todavía pide atención.',
    'Vas por buen camino, con un matiz que conviene no perder de vista.',
    'Predomina la energía favorable, pero un detalle exige tu lucidez y paciencia.',
    'El balance general es positivo, aunque el proceso requerirá de un pequeño ajuste.',
    'Hay buen viento a favor, solo asegurate de resolver lo que todavía genera fricción.',
    'Las perspectivas son buenas; no permitas que un pequeño obstáculo opaque tu avance.',
    'Avanzás con paso firme, pero la lectura te pide no desatender los pequeños detalles.',
    'El panorama es mayormente claro, siempre que estés dispuesto a integrar la lección pendiente.',
    'Llevás ventaja en esta situación, pero conviene moverte con observación consciente.',
    'El impulso es favorable: escuchá la advertencia de la carta menos cómoda y seguí adelante.',
    'Un camino con grandes posibilidades, donde el único límite será tu propia precaución.',
    'Tenés la mayor parte del terreno ganado, solo resta afinar un aspecto puntual.',
    'La energía te apoya, pero te exige actuar con madurez ante el matiz que aparece invertido.',
    'Es una lectura positiva que te recuerda que todo logro requiere un mínimo de estrategia.',
    'Hay un balance saludable en tu consulta, con un llamado a la responsabilidad personal.',
    'Gran parte de la tensión se disipa, dejando al descubierto una oportunidad real.',
    'Avanzá con seguridad, pero manteniendo los pies bien puestos sobre la tierra.',
    'El éxito de lo que pensaste depende de que no ignores esa pequeña llamada de atención.',
    'Las cartas muestran avances reales, aunque el ritmo sea un poco más pausado de lo previsto.',
    'Tenés las de ganar; solo cuidá dónde ponés tu energía para no dispersarte.',
    'La dirección es la correcta, pero el universo te pide pulir un detalle antes de saltar.',
    'Un panorama fértil que requiere que atiendas un asunto pendiente del proceso.',
    'Cuentas con buen respaldo energético; usá la cautela solo donde sea necesario.',
    'La tendencia es de crecimiento, siempre y cuando no fuerces la pieza que no encaja.',
    'Buenas noticias en lo general, con una valiosa lección de aprendizaje en el medio.',
    'Tenés el timón de la situación, solo esquivá la pequeña marejada que señala la lectura.',
    'El mapa es claro a tu favor; usá la advertencia presente como tu mejor herramienta.',
    'Hay mucha luz en tu consulta, solo cuidá de no tropezar por exceso de confianza.',
    'Una lectura noble que te invita a corregir un hábito antes de celebrar el resultado.',
    'Avanzás hacia la meta, con la recomendación de ajustar una actitud o pensamiento.',
    'El resultado pinta bien; no dejes que la impaciencia arruine la preparación.',
    'Un matiz de duda no logra opacar la gran fuerza constructiva que te respalda.',
    'Llevás las de ganar si sabés escuchar el pequeño aviso que te da el universo hoy.',
    'La balanza juega de tu lado: mantené la calma para resolver el detalle flojo.',
    'Progreso seguro, condicionado a que le des tiempo a lo que aún debe madurar.',
    'Hay claridad en el horizonte, solo protegete de distracciones menores en el camino.',
    'Cuentas con los recursos necesarios; atendé la llamada de cautela y triunfarás.',
    'Una lectura amiga que te felicita por lo logrado pero te pide afinar la puntería.',
    'El viento sopla a tu favor, solo ajustá bien las velas para no perder el rumbo.',
    'Buenas posibilidades de concreción; no descuides tu paz mental en el proceso.',
    'Casi todo está alineado; poné el último esfuerzo en sanar ese pequeño bloqueo.',
    'Un trayecto mayormente armónico donde la prudencia será tu mejor aliada.',
    'Hay fuerza de avance; solo estate atento a no repetir un error del pasado.',
    'Un panorama promisorio que demanda un toque de pragmatismo y cabeza fría.',
    'Aprovechá la buena racha sin ignorar el único semáforo amarillo de la lectura.',
    'Caminás hacia algo bueno; que la prisa no te haga pasar por alto los detalles.',
    'Tu intención es fuerte y viable; corregí el rumbo en lo pequeño y todo fluirá.',
    'Un escenario positivo que te premia si actuás con la madurez necesaria.',
    'Tenés la luz a tu favor, solo usá la sombra momentánea para reflexionar.',
    'Grandes probabilidades de éxito si atendés ese punto que pide cuidado.'
  ],
  1: [
    'Hay más tensión que calma en esta lectura — es una invitación a moverte con cuidado.',
    'El desafío pesa más que la calma hoy: prestale atención a lo que te cuesta soltar.',
    'Esta combinación te pide precaución antes de tomar decisiones apresuradas.',
    'Atravesás un tramo de revisión; no te apures a forzar resultados que necesitan tiempo.',
    'Hay matices complejos en tu consulta. Observá bien dónde estás poniendo tu energía.',
    'La lectura te sugiere paciencia: hay obstáculos que requieren estrategia más que impulso.',
    'No es un momento de avance a ciegas, sino de ajustar el rumbo y reevaluar expectativas.',
    'Hay llamadas de atención claras en tus cartas. Escuchá lo que el proceso te exige corregir.',
    'El escenario presenta cierta resistencia; cuidá tus recursos y tus palabras hoy.',
    'Una lectura que invita a la moderación. Protegé tu calma mientras se acomodan las piezas.',
    'Se observan nudos energéticos que conviene desatar con calma antes de actuar.',
    'La lectura te pide que no te engañes: hay un aspecto de esto que requiere coraje para ser visto.',
    'Momento de ser honesto con vos mismo sobre lo que realmente podés controlar.',
    'Hay más aprendizaje en la espera que en la acción impulsiva durante este tránsito.',
    'Un panorama que exige prudencia mental y emocional para no desgastar tus energías.',
    'El terreno está resbaladizo para esta consulta; da pasos cortos y bien calculados.',
    'No interpretes la resistencia como un fracaso, sino como un llamado a recalibrar.',
    'Es una lectura de alerta temprana: prevení conflictos antes de que se profundicen.',
    'Hay aspectos de tu pasado o presente que están frenando la proyección a futuro.',
    'Cuidá tus fronteras y tus límites; la energía disponible pide resguardo y prudencia.',
    'Una invitación a desacelerar para evaluar si el camino que elegiste sigue siendo el mejor.',
    'El universo te está marcando un desvío necesario para evitar un tropezón mayor.',
    'Aceptá los matices difíciles de hoy como información valiosa para fortalecerte.',
    'Tirada de paciencia activa: observá mucho, hablá poco y decidí con cabeza fría.',
    'Las respuestas no están afuera en este momento; resolvé primero la fricción interna.',
    'Avanzar a la fuerza bajo este clima astral solo generará más desgaste.',
    'Atendé los llamados de atención antes de dar el siguiente paso en este asunto.',
    'Hay aspectos ocultos o no resueltos que piden tu luz antes de continuar.',
    'La energía dominante te aconseja mantener un perfil bajo por unos días.',
    'No fuerces puertas que hoy están trabadas; buscá la enseñanza en la espera.',
    'Un momento de prueba donde la templanza será tu mayor virtud.',
    'Protegé tu foco: hay demasiadas distracciones o interferencias en el entorno.',
    'Se requiere una reestructuración de tu idea antes de llevarla a la práctica.',
    'Observá con lupa lo que estás dando por sentado; hay detalles que se te escapan.',
    'La incomodidad que transmite la lectura es una brújula para proteger tus emociones.',
    'Un freno oportuno que te salva de cometer una equivocación por ansiedad.',
    'Priorizá la estrategia sobre la emoción primaria al pensar en este tema.',
    'Hay resistencia en el ambiente; no es momento de confrontar sino de resguardarse.',
    'Revisá tus verdaderas motivaciones respecto a esta consulta antes de actuar.',
    'El camino presenta curvas cerradas: bajá la velocidad y observá el entorno.',
    'Tu intuición te advierte algo a través de estas cartas; no la ignores.',
    'El desafío es claro, pero tenés la capacidad de superarlo si no te precipitás.',
    'Momento de poner orden en tu interior antes de buscar respuestas afuera.',
    'Hay pérdidas de energía innecesarias; reevaluá dónde estás invirtiendo tu tiempo.',
    'La lectura te invita a soltar la rigidez para adaptarte a lo que se presenta.',
    'Un tránsito que exige cautela, madurez y mucha honestidad brutal con vos mismo.',
    'No te desanimes por los frenos; usalos como tiempo a favor para afinar tu plan.',
    'Cuidá lo que compartís con los demás respecto a este pensamiento por el momento.',
    'La marejada está un poco alta; esperá a que el agua se aclare para decidir.',
    'Un llamado a la prudencia que, si lo escuchás a tiempo, te ahorrará problemas.'
  ],
  0: [
    'Las tres cartas coinciden en pedirte pausa y cuidado — no es un día para forzar nada.',
    'Es una lectura que llama a la introspección más que a la acción. Escuchate.',
    'Hay mucha resistencia en la energía actual. El mejor movimiento hoy es parar y observar.',
    'El universo te pide freno de mano: revalida tu intención antes de dar el próximo paso.',
    'Momento de repliegue y cuidado personal. Evitá tomar decisiones drásticas hoy.',
    'La lectura indica un bloqueo transitorio. No te obstines en empujar lo que está cerrado.',
    'Tiempos de silencio y reflexión interna. La claridad llegará cuando bajes la guardia.',
    'Hay incomodidad o fricción en el ambiente respecto a esta consulta. Buscá tu centro primero.',
    'Las cartas sugieren que la situación aún no está madura para resolverse afuera.',
    'Aceptá la pausa como una protección, no como un castigo. Mañana habrá otra perspectiva.',
    'Un llamado directo a soltar el control sobre aquello que hoy no podés modificar.',
    'La lectura refleja agotamiento o desorientación; priorizá tu descanso y tu paz.',
    'Cerrá la puerta a la impaciencia: forzar las cosas bajo esta energía solo traerá frustración.',
    'Es un momento de siembra invisible, no de cosecha. Permitile al tiempo hacer su parte.',
    'Cuidá tu energía vital y no te expongas a discusiones o movimientos innecesarios.',
    'Las tres cartas se muestran reticentes; tómatelo como una tregua para recargar fuerzas.',
    'No es momento de buscar respuestas afuera, sino de guardar silencio y sanar por dentro.',
    'Hay una niebla transitoria en tu consulta; dejá que el polvo baje antes de caminar.',
    'El bloqueo que sentís es una señal de protección: no todo lo que deseamos nos conviene ya.',
    'Tirada de recogimiento absoluto. Meditá sobre lo que pensaste sin la urgencia de resolverlo.',
    'Un freno de mano saludable para evitar que tropieces con viejas estructuras.',
    'Retírate un paso hacia atrás para ver la escena completa cuando vuelva la luz.',
    'La energía sugiere replantearte la pregunta desde una perspectiva totalmente nueva.',
    'No hay prisa que valga cuando la marea está alta. Esperá a que el mar se calme.',
    'Respirá profundo y soltá la exigencia por hoy. El universo está reacomodando las fichas.',
    'Bloqueo absoluto en la energía actual: congelá las decisiones sobre este tema por hoy.',
    'No intentes abrir la puerta a la fuerza; el tiempo revelará el momento oportuno.',
    'Una lectura sombría que te protege de actuar en un momento completamente adverso.',
    'Desconectá de la preocupación; forzar una solución hoy solo empeorará el nudo.',
    'Hay una desconexión entre lo que querés y lo que el entorno puede ofrecerte hoy.',
    'Plena señal de Stop astral: la mejor acción ante esta consulta es el no-hacer.',
    'Retírate al refugio de tu serenidad; el ruido afuera no te dejará escuchar la verdad.',
    'Tirada de resguardo total: protegé tu corazón, tu dinero y tus planes por el momento.',
    'Nada de lo que intentes hoy en esta dirección dará el fruto que estás buscando.',
    'Un llamado de la vida a revisar si este deseo nace de tu ser o de tu ego.',
    'Las energías están cruzadas; postergá cualquier conversación importante sobre esto.',
    'Aceptá el estancamiento de hoy como un descanso necesario para tu mente.',
    'El panorama está cerrado por ahora; no intentes ver lo que todavía no se reveló.',
    'Hay patrones repetitivos pesados en esta consulta; rompelos deteniendo tu marcha.',
    'No gastes tus fuerzas en remar contra la corriente; dejá ir el control.',
    'La respuesta no está lista porque la situación aún necesita madurar en la sombra.',
    'Un silencio necesario del universo para que reevalúes si realmente querés esto.',
    'Suelto y confío: hacé de esa frase tu mantra de hoy ante esta lectura difícil.',
    'Cuidá tus energías; la fricción en las cartas indica un ambiente hostil para tu idea.',
    'El universo puso un obstáculo temporal para protegerte de un resultado indeseado.',
    'Momento de repliegue estratégico: no es cobardía, es sabiduría para no desgastarse.',
    'Evitá firmar, decidir o confrontar bajo el clima pesado de esta combinación.',
    'El estancamiento es solo externo; aprovechá para hacer el trabajo de limpieza interior.',
    'Resguardá tus planes en secreto hasta que el clima astral vuelva a despejarse.',
    'Mañana el panorama será distinto; hoy simplemente descansá y soltá la carga.'
  ]
};

    const spreadEl = document.getElementById('tarot-spread');
    const hintEl = document.getElementById('tarot-hint');
    const statusEl = document.getElementById('tarot-status');
    const readingEl = document.getElementById('tarot-reading');

    if (!spreadEl || !TAROT_ARCANA) return;

    const STORAGE_KEY = 'tarotDailySpread';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let revealed = false;

    function todayKey() {
      return new Date().toDateString(); // fecha local del navegador
    }

    function getStoredSpread() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.date !== todayKey()) return null; // es de otro día
        if (!Array.isArray(data.cards) || data.cards.length !== 3) return null;
        return data;
      } catch (e) {
        return null;
      }
    }

    function storeSpread(cards, synthesisIndex) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: todayKey(), cards, synthesisIndex
        }));
      } catch (e) { /* localStorage no disponible: no persiste, no rompe nada */ }
    }

    // Punto de reemplazo futuro: hoy resuelve local, mañana puede hacer
    // fetch('/api/tarot/draw') y devolver { cards: [{cardId,reversed} x3], synthesisIndex }.
function drawTodaySpread() {
  const existing = getStoredSpread();
  if (existing) return Promise.resolve(existing);

  // 3 cartas distintas (sin repetir), cada una derecha o invertida al azar.
  const shuffled = [...TAROT_ARCANA].sort(() => Math.random() - 0.5);
  const cards = shuffled.slice(0, 3).map(c => ({
    cardId: c.id,
    reversed: Math.random() < 0.5
  }));

  // Leemos la tirada anterior del localStorage para no repetir la frase de cierre
  let lastIndex = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      lastIndex = parsed.synthesisIndex;
    }
  } catch (e) { /* ignore */ }

  // Elegimos un índice al azar asegurando que no sea el mismo de ayer
  // y que busque dentro del total de frases disponibles (50 por categoría)
  let synthesisIndex;
  const maxOptions = SYNTHESIS[0].length; 
  do {
    synthesisIndex = Math.floor(Math.random() * maxOptions);
  } while (synthesisIndex === lastIndex && maxOptions > 1);

  storeSpread(cards, synthesisIndex);
  return Promise.resolve({ date: todayKey(), cards, synthesisIndex });
}

    // Arma los 3 slots (posición + carta) dentro de #tarot-spread.
    function buildSpread() {
      spreadEl.innerHTML = '';
      POSITIONS.forEach((pos, i) => {
        const slot = document.createElement('div');
        slot.className = 'tarot-slot';
        slot.dataset.index = String(i);
        slot.innerHTML =
          '<span class="tarot-position-label">' + pos.label + '</span>' +
          '<button type="button" class="tarot-card-single" id="tarot-card-' + i + '" aria-label="Revelar carta: ' + pos.label + '">' +
            '<div class="tarot-card-inner">' +
              '<div class="tarot-face tarot-face-back">' +
                '<div class="tarot-face-clip">' +
                  '<img src="./assets/astrales/dorso.jpg" alt="" onerror="this.remove()">' +
                '</div>' +
              '</div>' +
              '<div class="tarot-face tarot-face-front">' +
                '<div class="tarot-face-clip">' +
                  '<span class="tarot-front-number" id="tarot-front-number-' + i + '"></span>' +
                  '<span class="tarot-front-art" id="tarot-front-art-' + i + '"></span>' +
                  '<span class="tarot-front-name" id="tarot-front-name-' + i + '"></span>' +
                  '<span class="tarot-front-orientation" id="tarot-front-orientation-' + i + '"></span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</button>';
        spreadEl.appendChild(slot);
      });
    }

    function renderCardFace(i, card, reversed) {
      const btn = document.getElementById('tarot-card-' + i);
      document.getElementById('tarot-front-number-' + i).textContent = card.numeral;
      document.getElementById('tarot-front-name-' + i).textContent = card.name;
      document.getElementById('tarot-front-orientation-' + i).textContent = reversed ? 'Invertida' : 'Derecha';
      document.getElementById('tarot-front-art-' + i).innerHTML =
        '<img src="' + card.image + '" alt="' + card.name + '" ' +
        'onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{textContent:\'✦\'}))">';
      btn.classList.toggle('tarot-reversed', reversed);
    }

    function buildReadingHTML(cards, synthesisIndex) {
      let constructiveCount = 0;
      let html = '';

      cards.forEach((draw, i) => {
        const card = TAROT_ARCANA[draw.cardId];
        const data = draw.reversed ? card.reversed : card.upright;
        if (data.energy === 'constructiva') constructiveCount++;

        html +=
          '<div class="tarot-reading-card">' +
            '<p class="tarot-reading-position">' + POSITIONS[i].label + '</p>' +
            '<span class="tarot-reading-title">' + card.numeral + ' · ' + card.name + '</span>' +
            '<span class="tarot-reading-orientation">' + (draw.reversed ? 'Invertida' : 'Derecha') + '</span>' +
            '<p class="tarot-reading-meaning">' + data.meaning + '</p>' +
            '<p class="tarot-reading-desc">' + data.description + '</p>' +
          '</div>';
      });

      const synthesisText = SYNTHESIS[constructiveCount][synthesisIndex];
      html +=
        '<div class="tarot-reading-synthesis">' +
          '<p class="tarot-reading-synthesis-label">En conjunto</p>' +
          '<p class="tarot-reading-synthesis-text">' + synthesisText + '</p>' +
        '</div>' +
        '<span class="tarot-next">Volvé mañana para descubrir una nueva tirada.</span>';

      return html;
    }

    function showReading(cards, synthesisIndex) {
      readingEl.innerHTML = buildReadingHTML(cards, synthesisIndex);
      readingEl.hidden = false;
      requestAnimationFrame(() => readingEl.classList.add('visible'));
    }

    function revealSpread(cards, synthesisIndex, animated) {
      revealed = true;
      hintEl.textContent = '';

      cards.forEach((draw, i) => {
        const card = TAROT_ARCANA[draw.cardId];
        renderCardFace(i, card, draw.reversed);
        const btn = document.getElementById('tarot-card-' + i);
        btn.classList.add('tarot-revealed');
      });

      if (animated && !prefersReducedMotion) {
        // Se giran una por una, con una leve pausa entre cada una.
        cards.forEach((draw, i) => {
          setTimeout(() => {
            document.getElementById('tarot-card-' + i).classList.add('tarot-flipped');
          }, i * 220);
        });
        setTimeout(() => showReading(cards, synthesisIndex), cards.length * 220 + 950);
      } else {
        cards.forEach((draw, i) => {
          document.getElementById('tarot-card-' + i).classList.add('tarot-flipped');
        });
        showReading(cards, synthesisIndex);
      }
    }

    buildSpread();

    // ---- Carrusel mobile: una carta grande al centro, dos espiando a los
    // costados. En desktop este bloque no hace nada visible (la media
    // query que activa el layout absoluto no aplica ahí). ----
    const COVERFLOW_QUERY = window.matchMedia('(max-width: 640px)');
    let activeIndex = 1; // arranca con la carta del medio al centro

    function applyCoverflowLayout() {
      const coverflow = COVERFLOW_QUERY.matches;
      spreadEl.classList.toggle('tarot-spread--coverflow', coverflow);

      spreadEl.querySelectorAll('.tarot-slot').forEach((slot) => {
        if (!coverflow) {
          slot.style.transform = '';
          slot.style.zIndex = '';
          slot.style.opacity = '';
          return;
        }
        const i = Number(slot.dataset.index);
        const delta = i - activeIndex; // -2..2 posible con 3 cartas
        const absDelta = Math.min(Math.abs(delta), 2);
        const scale = 1 - absDelta * 0.2;
        const tx = delta * 62;
        const rot = delta * 5;
        slot.style.transform = 'translate(calc(-50% + ' + tx + 'px), 0) scale(' + scale + ') rotate(' + rot + 'deg)';
        slot.style.zIndex = String(10 - absDelta);
        slot.style.opacity = absDelta === 0 ? '1' : (absDelta === 1 ? '0.82' : '0.5');
      });
    }

    applyCoverflowLayout();
    // Si el usuario rota el celular o cruza el breakpoint, reacomodar.
    if (COVERFLOW_QUERY.addEventListener) {
      COVERFLOW_QUERY.addEventListener('change', applyCoverflowLayout);
    }
    window.addEventListener('resize', () => {
      if (COVERFLOW_QUERY.matches) applyCoverflowLayout();
    });

    // Al cargar: si ya se tiró la tirada hoy, mostrarla directo (sin animación).
    const existingSpread = getStoredSpread();
    if (existingSpread) {
      revealSpread(existingSpread.cards, existingSpread.synthesisIndex, false);
    }

    spreadEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.tarot-card-single');
      if (!btn) return;
      const slot = btn.closest('.tarot-slot');
      const i = Number(slot.dataset.index);

      // En mobile, si tocaste una carta lateral, primero la centramos —
      // recién un segundo toque (ya en el centro) revela la tirada.
      if (COVERFLOW_QUERY.matches && i !== activeIndex) {
        activeIndex = i;
        applyCoverflowLayout();
        return;
      }

      if (revealed) return; // ya centrada y ya revelada: no hay más acción

      statusEl.textContent = '';
      spreadEl.querySelectorAll('.tarot-card-single').forEach(b => b.disabled = true);

      drawTodaySpread()
        .then(({ cards, synthesisIndex }) => {
          revealSpread(cards, synthesisIndex, true);
          spreadEl.querySelectorAll('.tarot-card-single').forEach(b => b.disabled = false);
        })
        .catch(() => {
          statusEl.classList.add('error');
          statusEl.textContent = 'No pudimos revelar tu lectura. Intentá nuevamente.';
          spreadEl.querySelectorAll('.tarot-card-single').forEach(b => b.disabled = false);
        });
    });
  })();
})();
