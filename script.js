document.addEventListener('DOMContentLoaded', () => {
    const photos = document.querySelectorAll('.photo img');
    const mainTitle = document.querySelector('#main-title');

    // Parallax scrolling for title
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        mainTitle.style.transform = `translateY(${scrollY * 0.5}px)`;
    });

    // Intersection observer for fade-in animation
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.closest('.photo').style.animation = 'fadeIn 1s ease-out forwards';
            }
        });
    }, {
        threshold: 0.5
    });

    photos.forEach(photo => {
        observer.observe(photo.closest('.photo'));

        // Add click functionality for image expansion
        photo.addEventListener('click', () => {
            if (photo.classList.contains('expanded')) {
                photo.classList.remove('expanded');
            } else {
                document.querySelectorAll('.photo img.expanded').forEach(expandedPhoto => {
                    expandedPhoto.classList.remove('expanded');
                });
                photo.classList.add('expanded');
            }
        });
    });

    // Particle effect (basic example using canvas)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 5 + 1,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        color: `hsl(${Math.random() * 360}, 70%, 80%)`
    }));

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animateParticles);
    }

    animateParticles();
});