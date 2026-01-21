// Mayer F&D - Prototype 2 - Dark Luxury JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect with dynamic blur
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            if (navMenu) {
                navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
            }
        });
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Active nav link highlight
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // ========== HERO CAROUSEL ==========
    initHeroCarousel();

    function initHeroCarousel() {
        const track = document.getElementById('heroCarouselTrack');
        const prevBtn = document.getElementById('carouselPrev');
        const nextBtn = document.getElementById('carouselNext');
        const dotsContainer = document.getElementById('carouselDots');

        if (!track) return;

        const slides = track.querySelectorAll('.carousel-slide');
        const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
        let currentIndex = 0;
        let autoPlayTimer;
        const AUTO_PLAY_INTERVAL = 5000;

        function showSlide(index) {
            // Wrap around
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            currentIndex = index;

            // Update slides
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === currentIndex);
            });

            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        }

        function nextSlide() {
            showSlide(currentIndex + 1);
        }

        function prevSlide() {
            showSlide(currentIndex - 1);
        }

        function startAutoPlay() {
            stopAutoPlay();
            autoPlayTimer = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
        }

        function stopAutoPlay() {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
            }
        }

        // Event listeners
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                startAutoPlay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                startAutoPlay();
            });
        }

        // Dot click handlers
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                showSlide(i);
                startAutoPlay();
            });
        });

        // Pause on hover
        track.parentElement.addEventListener('mouseenter', stopAutoPlay);
        track.parentElement.addEventListener('mouseleave', startAutoPlay);

        // Start autoplay
        startAutoPlay();
    }

    // Intersection Observer for scroll animations
    const animateOnScroll = (entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = `${index * 0.1}s`;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(animateOnScroll, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });

    // Add initial hidden state to animated elements
    const animatedElements = document.querySelectorAll('.service-card, .event-card, .cocktail-card, .gallery-item, .about-feature, .catering-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add visible state styles
    const style = document.createElement('style');
    style.textContent = `.visible { opacity: 1 !important; transform: translateY(0) !important; }`;
    document.head.appendChild(style);

    // Form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            console.log('Form data:', data);

            // Show success message
            alert('¡Gracias por contactarnos! Te responderemos pronto.');
            contactForm.reset();
        });
    }

    // Parallax effect on hero carousel
    const heroCarousel = document.querySelector('.hero-carousel');
    if (heroCarousel) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            if (scrolled < window.innerHeight) {
                heroCarousel.style.transform = `translateY(${scrolled * 0.1}px)`;
            }
        });
    }

    // Counter animation for stats
    const animateCounter = (element, target) => {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + (element.dataset.suffix || '');
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + (element.dataset.suffix || '');
            }
        }, 30);
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statValue = entry.target.querySelector('.stat-value');
                if (statValue && !statValue.dataset.animated) {
                    const text = statValue.textContent;
                    const num = parseInt(text);
                    const suffix = text.replace(num, '');
                    statValue.dataset.suffix = suffix;
                    statValue.dataset.animated = 'true';
                    animateCounter(statValue, num);
                }
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-item').forEach(stat => {
        statsObserver.observe(stat);
    });

    // Export initHeroCarousel globally so CMS loader can reinitialize after content load
    window.initHeroCarousel = initHeroCarousel;

    console.log('Mayer F&D - Prototype 2 loaded successfully');
});
