/**
 * Hero Carousel & Navbar Blur Effect
 * Mayer Food & Drink - Premium Event Services
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // NAVBAR BLUR EFFECT ON SCROLL
    // ========================================
    const navbar = document.getElementById('navbar');
    const scrollThreshold = 50; // Pixels to scroll before applying blur

    function handleNavbarScroll() {
        if (window.scrollY > scrollThreshold) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Initial check on page load
    handleNavbarScroll();

    // Listen for scroll events with passive option for better performance
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });

    // ========================================
    // HERO CAROUSEL FUNCTIONALITY
    // ========================================
    const carouselTrack = document.getElementById('heroCarouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dotsContainer = document.getElementById('carouselDots');

    if (!carouselTrack) {
        console.warn('Carousel track not found');
        return;
    }

    const slides = carouselTrack.querySelectorAll('.carousel-slide');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
    let currentIndex = 0;
    let autoplayInterval = null;
    const autoplayDelay = 5000; // 5 seconds between slides
    let isTransitioning = false;

    /**
     * Update the carousel to show the slide at the given index
     * @param {number} index - The index of the slide to show
     * @param {boolean} animate - Whether to animate the transition
     */
    function goToSlide(index, animate = true) {
        if (isTransitioning) return;

        // Handle wrap-around
        if (index < 0) {
            index = slides.length - 1;
        } else if (index >= slides.length) {
            index = 0;
        }

        // If already on this slide, do nothing
        if (index === currentIndex && animate) return;

        isTransitioning = true;

        // Remove active class from current slide
        slides[currentIndex].classList.remove('active');
        if (dots[currentIndex]) {
            dots[currentIndex].classList.remove('active');
        }

        // Update current index
        currentIndex = index;

        // Add active class to new slide
        slides[currentIndex].classList.add('active');
        if (dots[currentIndex]) {
            dots[currentIndex].classList.add('active');
        }

        // Reset transition lock after animation
        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    }

    /**
     * Move to the next slide
     */
    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    /**
     * Move to the previous slide
     */
    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    /**
     * Start autoplay
     */
    function startAutoplay() {
        stopAutoplay(); // Clear any existing interval
        autoplayInterval = setInterval(nextSlide, autoplayDelay);
    }

    /**
     * Stop autoplay
     */
    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }

    /**
     * Reset autoplay (restart timer after manual navigation)
     */
    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    // Event Listeners for navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoplay();
        });
    }

    // Event Listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            resetAutoplay();
        });
    });

    // Pause autoplay on hover
    const carouselContainer = carouselTrack.closest('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoplay);
        carouselContainer.addEventListener('mouseleave', startAutoplay);
    }

    // Touch/Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
    }, { passive: true });

    carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoplay();
    }, { passive: true });

    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                // Swiped right - go to previous
                prevSlide();
            } else {
                // Swiped left - go to next
                nextSlide();
            }
        }
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Only handle if carousel is visible in viewport
        const heroSection = document.getElementById('home');
        if (!heroSection) return;

        const rect = heroSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible) {
            if (e.key === 'ArrowLeft') {
                prevSlide();
                resetAutoplay();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
                resetAutoplay();
            }
        }
    });

    // Pause autoplay when page is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    });

    // Initialize the first slide and start autoplay
    goToSlide(0, false);
    startAutoplay();

    // ========================================
    // INTERSECTION OBSERVER FOR ANIMATIONS
    // ========================================
    // Add fade-in animation when carousel comes into view
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const heroCarousel = document.querySelector('.hero-carousel');
    if (heroCarousel) {
        fadeInObserver.observe(heroCarousel);
    }

    console.log('🎠 Hero Carousel initialized');
    console.log('🎨 Navbar blur effect enabled');
});
