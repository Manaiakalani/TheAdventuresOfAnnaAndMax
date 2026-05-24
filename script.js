document.addEventListener('DOMContentLoaded', () => {
    const photos = document.querySelectorAll('.photo img');
    const mainTitle = document.getElementById('main-title');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let isReducedMotion = prefersReducedMotion.matches;
    let ticking = false;
    let parallaxEnabled = false;
    let canvas = null;
    let ctx = null;
    let particles = [];
    let animationId = null;
    let particlesEnabled = false;
    let paused = false;

    function updateTitlePosition() {
        if (!mainTitle || isReducedMotion) {
            ticking = false;
            return;
        }

        mainTitle.style.transform = `translateY(${window.scrollY * 0.5}px)`;
        ticking = false;
    }

    function handleScroll() {
        if (isReducedMotion || !mainTitle || ticking) {
            return;
        }

        ticking = true;
        requestAnimationFrame(updateTitlePosition);
    }

    function enableParallax() {
        if (!mainTitle || parallaxEnabled) {
            return;
        }

        parallaxEnabled = true;
        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }

    function disableParallax() {
        if (!mainTitle || !parallaxEnabled) {
            return;
        }

        window.removeEventListener('scroll', handleScroll);
        mainTitle.style.transform = '';
        ticking = false;
        parallaxEnabled = false;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeIn 1s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    photos.forEach(photo => {
        const photoDiv = photo.closest('.photo');
        if (photoDiv) {
            photoDiv.style.opacity = '0';
            observer.observe(photoDiv);
        }
    });

    function createLightbox(imgSrc, imgAlt) {
        const existingOverlay = document.querySelector('.lightbox-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', imgAlt || 'Expanded image');
        overlay.tabIndex = -1;

        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = imgAlt;
        img.className = 'lightbox-image';

        overlay.appendChild(img);
        document.body.appendChild(overlay);

        const previousActiveElement = document.activeElement;
        let isClosing = false;

        function close() {
            if (isClosing) {
                return;
            }

            isClosing = true;
            overlay.classList.remove('active');
            document.removeEventListener('keydown', handleKeydown);
            overlay.removeEventListener('click', handleOverlayClick);
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
                if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
                    previousActiveElement.focus();
                }
            }, { once: true });
        }

        function handleKeydown(event) {
            if (event.key === 'Escape') {
                close();
            }
        }

        function handleOverlayClick(event) {
            if (event.target === overlay) {
                close();
            }
        }

        overlay.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleKeydown);

        requestAnimationFrame(() => {
            overlay.classList.add('active');
            overlay.focus();
        });
    }

    photos.forEach(photo => {
        photo.style.cursor = 'pointer';
        photo.addEventListener('click', () => {
            createLightbox(photo.src, photo.alt);
        });
    });

    function resizeCanvas() {
        if (!canvas) {
            return;
        }

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function animateParticles() {
        if (!particlesEnabled || !ctx || !canvas || paused || isReducedMotion) {
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            if (particle.x < 0 || particle.x > canvas.width) {
                particle.speedX *= -1;
            }

            if (particle.y < 0 || particle.y > canvas.height) {
                particle.speedY *= -1;
            }

            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });

        animationId = requestAnimationFrame(animateParticles);
    }

    function handleVisibilityChange() {
        if (!particlesEnabled) {
            return;
        }

        if (document.hidden) {
            paused = true;
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            return;
        }

        if (!isReducedMotion) {
            paused = false;
            animateParticles();
        }
    }

    function enableParticles() {
        if (particlesEnabled || isReducedMotion) {
            return;
        }

        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');

        if (!ctx) {
            canvas = null;
            return;
        }

        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;';
        document.body.appendChild(canvas);

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 4 + 1,
            speedX: Math.random() * 1.5 - 0.75,
            speedY: Math.random() * 1.5 - 0.75,
            color: `hsl(${Math.random() * 360}, 70%, 80%)`
        }));

        particlesEnabled = true;
        paused = document.hidden;

        if (!paused) {
            animateParticles();
        }
    }

    function disableParticles() {
        if (!particlesEnabled) {
            return;
        }

        paused = true;
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        window.removeEventListener('resize', resizeCanvas);
        document.removeEventListener('visibilitychange', handleVisibilityChange);

        if (canvas) {
            canvas.remove();
        }

        canvas = null;
        ctx = null;
        particles = [];
        particlesEnabled = false;
    }

    function applyMotionPreference() {
        isReducedMotion = prefersReducedMotion.matches;

        if (isReducedMotion) {
            disableParallax();
            disableParticles();
            return;
        }

        enableParallax();
        enableParticles();
    }

    const handleMotionPreferenceChange = () => {
        applyMotionPreference();
    };

    if (typeof prefersReducedMotion.addEventListener === 'function') {
        prefersReducedMotion.addEventListener('change', handleMotionPreferenceChange);
    } else if (typeof prefersReducedMotion.addListener === 'function') {
        prefersReducedMotion.addListener(handleMotionPreferenceChange);
    }

    applyMotionPreference();
});
