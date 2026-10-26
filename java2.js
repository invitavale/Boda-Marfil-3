// Variables globales
let isPlaying = false;
let player = null;
let playerReady = false;
let currentSlide = 0;
const totalSlides = 6;
let enableMusic = false;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCountdown();
    initializeCarousel();
    initializeModal();
    initializeParallax();
    initializeGuestGreeting();
    initializeLayers(); // después del saludo: depende de si la sección de invitados se muestra
    loadYouTubeAPI(); // Se precarga desde el inicio (no en el click) para que
                       // playVideo() pueda ejecutarse de forma síncrona dentro
                       // del gesto del usuario. Esto es lo que exige iOS Safari.
});

// Sección de saludo personalizado por invitado/familia, leída desde la URL.
// Formatos soportados:
//   ?invitados=Juan Arias,Yerianny Arias,Valery Arias
//   ?familia=Arias
// Muestra un badge con el total, título "Invitados", el número de
// acompañantes (si aplica) y cada nombre como fila con colores intercalados
// de la paleta dorada del sitio, ciclando si hay más de 4 nombres.
function initializeGuestGreeting() {
    const params = new URLSearchParams(window.location.search);
    const invitadosParam = params.get('invitados');
    const familiaParam = params.get('familia');

    const section = document.getElementById('guestSection');
    const badge = document.getElementById('guestBadge');
    const subtitle = document.getElementById('guestSubtitle');
    const greeting = document.getElementById('guestGreeting');
    if (!section || !badge || !subtitle || !greeting) return;

    let names = [];

    if (invitadosParam) {
        names = invitadosParam.split(',').map(n => decodeURIComponent(n.trim())).filter(Boolean);
    } else if (familiaParam) {
        names = [`Familia ${familiaParam.trim()}`];
    }

    if (names.length === 0) return;

    // Badge con el total de invitados
    badge.textContent = names.length;

    // Subtítulo de acompañantes: solo tiene sentido cuando hay más de un
    // nombre individual (no aplica al formato "Familia X")
    const companions = invitadosParam ? names.length - 1 : 0;
    if (companions > 0) {
        subtitle.textContent = `(${companions} acompañante${companions > 1 ? 's' : ''})`;
        subtitle.style.display = 'block';
    } else {
        subtitle.style.display = 'none';
    }

    // Limpiar contenido previo
    greeting.innerHTML = '';

    names.forEach((name, index) => {
        const nameSpan = document.createElement('span');
        const colorIndex = (index % 4) + 1;
        nameSpan.className = `guest-name color-${colorIndex}`;
        nameSpan.textContent = name;
        greeting.appendChild(nameSpan);
    });

    section.style.display = 'block';
}

// Capas alternadas: a las secciones visibles (sin contar el footer) les
// asigna arriba / abajo / arriba... La primera siempre va arriba para
// montarse sobre la portada.
function initializeLayers() {
    const layers = Array.from(document.querySelectorAll('.layers > .layer:not(.footer)'))
        .filter(el => getComputedStyle(el).display !== 'none');
    layers.forEach((el, i) => {
        el.classList.remove('layer--up', 'layer--down', 'layer--last');
        el.classList.add(i % 2 === 0 ? 'layer--up' : 'layer--down');
        if (i === layers.length - 1) el.classList.add('layer--last');
    });
    const footer = document.querySelector('.layers > .footer');
    if (footer) {
        const lastIsUp = layers.length % 2 === 1;
        footer.classList.toggle('layer--after-up', lastIsUp);
        // Si la última es hundida, el footer se eleva con ola propia y
        // esa última sección conserva su sombra inferior
        footer.classList.toggle('footer--raised', !lastIsUp);
        if (!lastIsUp && layers.length) layers[layers.length - 1].classList.remove('layer--last');
    }
}

// Modal de bienvenida
function initializeModal() {
    const enterWithMusic = document.getElementById('enterWithMusic');
    const enterWithoutMusic = document.getElementById('enterWithoutMusic');
    const modal = document.getElementById('welcomeModal');

    enterWithMusic.addEventListener('click', function() {
        enableMusic = true;
        modal.style.display = 'none';
        document.getElementById('musicPlayer').style.display = 'block';

        // El video ya se está reproduciendo en silencio desde que cargó la
        // página (ver onPlayerReady). Acá solo le quitamos el mute, que es
        // una acción síncrona dentro del gesto del usuario: es lo único que
        // iOS Safari exige para permitir audio, así que suena "de una" en
        // este primer toque, sin depender de que playVideo() arranque justo
        // en este instante.
        if (playerReady && player) {
            player.unMute();
            if (!isPlaying) {
                player.playVideo();
            }
            isPlaying = true;
            updateMusicIcon();
        }
        // Si el player todavía no está listo (conexión lenta), onPlayerReady
        // se encarga de quitar el mute apenas termine de inicializar.
    });

    enterWithoutMusic.addEventListener('click', function() {
        enableMusic = false;
        modal.style.display = 'none';
        // Si ya estaba sonando en silencio, la pausamos y la volvemos a mutear.
        if (playerReady && player) {
            player.pauseVideo();
            player.mute();
            isPlaying = false;
        }
    });
}

// Cargar la API de YouTube
function loadYouTubeAPI() {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
    window.onYouTubeIframeAPIReady = initializeYouTubePlayer;
}

// Función llamada por la API de YouTube
function initializeYouTubePlayer() {
    player = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        videoId: 'jb0K64SGsfc',
        playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            playlist: 'jb0K64SGsfc'
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    playerReady = true;
    const musicToggle = document.getElementById('musicToggle');
    musicToggle.addEventListener('click', toggleMusic);

    // Arrancamos la reproducción en silencio desde ya. El autoplay muteado
    // está permitido por Safari/iOS sin necesidad de gesto del usuario, así
    // que cuando el usuario toque "Ingresar con música" solo hace falta
    // quitarle el mute (acción síncrona dentro del click) para que se
    // escuche de inmediato, sin ningún retraso.
    event.target.mute();
    event.target.playVideo();

    // Caso borde: el usuario ya hizo click en "con música" antes de que el
    // player terminara de inicializar (ej. conexión lenta). Le quitamos el
    // mute apenas esté listo.
    if (enableMusic && !isPlaying) {
        document.getElementById('musicPlayer').style.display = 'block';
        event.target.unMute();
        isPlaying = true;
        updateMusicIcon();
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
    }
    updateMusicIcon();
}

function onPlayerError(event) {
    console.log('Error al cargar el video de YouTube');
    const musicPlayer = document.getElementById('musicPlayer');
    musicPlayer.style.display = 'block';
    isPlaying = false;
    updateMusicIcon();
}

function toggleMusic() {
    if (player) {
        if (isPlaying) {
            player.pauseVideo();
            isPlaying = false;
        } else {
            player.playVideo();
            isPlaying = true;
        }
        updateMusicIcon();
    }
}

function updateMusicIcon() {
    const volumeIcon = document.getElementById('volumeIcon');
    
    if (isPlaying) {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"></path>
        `;
    } else {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
        `;
    }
}

// Countdown
function initializeCountdown() {
    const targetDate = new Date('2026-12-31T10:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;
        
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        } else {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Carrusel
function initializeCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentSlideElement = document.getElementById('currentSlide');
    const totalSlidesElement = document.getElementById('totalSlides');
    
    totalSlidesElement.textContent = totalSlides;
    updateSlideCounter();
    
    prevBtn.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
        } else {
            currentSlide = totalSlides - 1;
        }
        updateCarousel();
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
        } else {
            currentSlide = 0;
        }
        updateCarousel();
    });
    
    // Auto-play del carrusel
    setInterval(() => {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
        } else {
            currentSlide = 0;
        }
        updateCarousel();
    }, 4000);
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const translateX = -currentSlide * 100;
    track.style.transform = `translateX(${translateX}%)`;
    updateSlideCounter();
}

function updateSlideCounter() {
    const currentSlideElement = document.getElementById('currentSlide');
    currentSlideElement.textContent = currentSlide + 1;
}

// Parallax en la portada (mueve la capa de fondo al hacer scroll)
function initializeParallax() {
    const heroLayer = document.querySelector('.hero .hero-bg');
    if (!heroLayer) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let lastScrollY = window.scrollY || window.pageYOffset;
    let ticking = false;

    const computeSpeed = () => (window.innerWidth <= 768 ? 0.65 : 0.5);

    const render = () => {
        if (prefersReducedMotion.matches) {
            heroLayer.style.transform = 'translate3d(0,0,0)';
        } else {
            const speed = computeSpeed();
            // Tope: nunca desplazar más que el colchón real de la capa (60px fijos,
            // igual al valor definido en CSS), para que no se despegue del contenedor
            // y deje un hueco vacío, sin necesidad de sobredimensionar la imagen.
            const BUFFER_PX = 60;
            let translateY = lastScrollY * speed;
            translateY = Math.max(0, Math.min(BUFFER_PX, translateY));
            heroLayer.style.transform = `translate3d(0, ${Math.round(translateY)}px, 0)`;
        }
        ticking = false;
    };

    const onScroll = () => {
        lastScrollY = window.scrollY || window.pageYOffset;
        if (!ticking) {
            window.requestAnimationFrame(render);
            ticking = true;
        }
    };

    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', render);
}

// Funciones de los botones
// Nota: esta es una plantilla de ejemplo. Los botones de "¿Cómo llegar?",
// "Subir foto", "Ver más" (regalo) y "Confirmar asistencia" se dejaron sin
// enlace a propósito (sin onclick en el HTML); cuando se use con datos
// reales, cada uno debe apuntar a su Google Maps, carpeta de Drive,
// método de regalo y Google Form correspondientes.

function showDressCode() {
    showToast("Código de vestimenta", "Elegante sport. Colores tierra, neutros y champán son bienvenidos.");
}

function showTips() {
    showToast("Tips y notas", "La ceremonia será al aire libre. Se recomienda llegar 15 minutos antes.");
}

// Sistema de Toast
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastContent = document.getElementById('toastContent');
    
    toastContent.innerHTML = `
        <h4 style="color: hsl(var(--brown)); margin-bottom: 0.35rem;">${title}</h4>
        <p style="color: hsl(var(--foreground) / 0.7);">${message}</p>
    `;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Álbum compartido de Google Fotos
function uploadPhoto() {
    window.open('https://photos.app.goo.gl/b2UVjmavA8Pwxa6X6', '_blank', 'noopener');
}

// Regalos: el modal (datos bancarios / mesa de regalos) vive en regalo-modal.js
function showGifts() {
    if (window.openGiftModal) window.openGiftModal();
}

// Confirmación de asistencia (Google Form)
function confirmAttendance() {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLScxojtt9jqEa84t0NWAciUShVSkWZlxG8qITy1HFrg_ssM1qA/viewform?usp=publish-editor', '_blank', 'noopener');
}
