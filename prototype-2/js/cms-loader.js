// Mayer F&D - Dynamic Content Loader
// Conecta el frontend con el CMS Backend

const API_BASE_URL = 'http://localhost:3003';

// Helper function to resolve image URLs
// Converts relative URLs to absolute URLs pointing to the backend
function resolveImageUrl(imageUrl) {
    if (!imageUrl) return '';

    // If it's already an absolute URL (http/https), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // If it's a relative URL (starts with /), prepend the API base URL
    if (imageUrl.startsWith('/')) {
        return `${API_BASE_URL}${imageUrl}`;
    }

    // Otherwise, treat as relative to images directory
    return `${API_BASE_URL}/images/${imageUrl}`;
}

// Load and apply content from CMS
async function loadCMSContent() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/content`);
        if (!response.ok) throw new Error('Failed to fetch content');

        const content = await response.json();

        // Apply content to each section
        applyHeroContent(content.hero);
        applyAboutContent(content.about);
        applyServicesContent(content.services);
        applyCateringContent(content.catering);
        applyEventsContent(content.events);
        applyDulcesContent(content.dulces);
        applyCocteleriaContent(content.cocteleria);
        applyGalleryContent(content.gallery);
        applyContactContent(content.contact);
        applyFooterContent(content.footer);

        // Reinitialize the hero carousel after content is loaded
        // This is needed because the carousel slides are dynamically created
        if (typeof window.initHeroCarousel === 'function') {
            window.initHeroCarousel();
        }

        console.log('✅ CMS Content loaded successfully');
    } catch (error) {
        console.warn('⚠️ Could not load CMS content, using static content:', error.message);
    }
}

// Helper function to safely set text content
function setText(selector, text) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        if (el && text) el.textContent = text;
    });
}

// Helper function to safely set innerHTML
function setHTML(selector, html) {
    const el = document.querySelector(selector);
    if (el && html) el.innerHTML = html;
}

// Helper function to safely set image src with URL resolution
function setImage(selector, src) {
    const el = document.querySelector(selector);
    if (el && src) {
        el.src = resolveImageUrl(src);
    }
}

// ========== SECTION CONTENT APPLIERS ==========

function applyHeroContent(data) {
    if (!data) return;

    // Label
    setText('.hero-label', data.label);

    // Title
    const titleContainer = document.querySelector('.hero-title');
    if (titleContainer && data.title) {
        titleContainer.innerHTML = `
            ${data.title.line1 || ''}<br>
            <span>${data.title.line2 || ''}</span><br>
            ${data.title.line3 || ''}<br>
            <span>${data.title.line4 || ''}</span>
        `;
    }

    // Description
    setText('.hero-description', data.description);

    // Stats
    if (data.stats && data.stats.length > 0) {
        const statsContainer = document.querySelector('.hero-stats');
        if (statsContainer) {
            statsContainer.innerHTML = data.stats.map(stat => `
                <div class="stat-item">
                    <span class="stat-value">${stat.value}</span>
                    <span class="stat-label">${stat.label}</span>
                </div>
            `).join('');
        }
    }

    // Carousel Images - update the carousel slides
    if (data.images) {
        const carouselTrack = document.getElementById('heroCarouselTrack');
        const dotsContainer = document.getElementById('carouselDots');

        if (carouselTrack) {
            // Collect all available images
            const images = [];
            if (data.images.main) images.push({ url: data.images.main, alt: 'Imagen Principal' });
            if (data.images.float1) images.push({ url: data.images.float1, alt: 'Galería 1' });
            if (data.images.float2) images.push({ url: data.images.float2, alt: 'Galería 2' });
            // Support for additional carousel images if defined
            if (data.images.carousel && Array.isArray(data.images.carousel)) {
                data.images.carousel.forEach((img, i) => {
                    images.push({ url: img, alt: `Galería ${i + 3}` });
                });
            }

            if (images.length > 0) {
                // Generate carousel slides
                carouselTrack.innerHTML = images.map((img, index) => `
                    <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                        <img src="${resolveImageUrl(img.url)}" alt="${img.alt}" loading="lazy">
                    </div>
                `).join('');

                // Generate dots
                if (dotsContainer) {
                    dotsContainer.innerHTML = images.map((_, index) => `
                        <span class="dot ${index === 0 ? 'active' : ''}"></span>
                    `).join('');

                    // Reinitialize carousel event listeners for new dots
                    const dots = dotsContainer.querySelectorAll('.dot');
                    const slides = carouselTrack.querySelectorAll('.carousel-slide');

                    dots.forEach((dot, i) => {
                        dot.addEventListener('click', () => {
                            slides.forEach((slide, j) => {
                                slide.classList.toggle('active', j === i);
                            });
                            dots.forEach((d, j) => {
                                d.classList.toggle('active', j === i);
                            });
                        });
                    });
                }
            }
        }
    }
}

function applyAboutContent(data) {
    if (!data) return;

    setText('#about .section-label', data.label);

    // Title with highlight
    const titleEl = document.querySelector('#about .section-title');
    if (titleEl && data.title && data.titleHighlight) {
        titleEl.innerHTML = data.title.replace(
            data.titleHighlight,
            `<span>${data.titleHighlight}</span>`
        );
    }

    setText('#about .section-description', data.description);
    setImage('.about-image img', data.image);

    // Features
    if (data.features && data.features.length > 0) {
        const featuresContainer = document.querySelector('.about-features');
        if (featuresContainer) {
            featuresContainer.innerHTML = data.features.map(feature => `
                <div class="feature-card">
                    <span class="feature-icon">${feature.icon}</span>
                    <h4>${feature.title}</h4>
                    <p>${feature.description}</p>
                </div>
            `).join('');
        }
    }
}

function applyServicesContent(data) {
    if (!data) return;

    setText('#servicios .section-label', data.label);

    const titleEl = document.querySelector('#servicios .section-title');
    if (titleEl && data.title && data.titleHighlight) {
        titleEl.innerHTML = data.title.replace(
            data.titleHighlight,
            `<span>${data.titleHighlight}</span>`
        );
    }

    setText('#servicios .section-description', data.description);

    // Service items
    if (data.items && data.items.length > 0) {
        const servicesGrid = document.querySelector('.services-grid');
        if (servicesGrid) {
            servicesGrid.innerHTML = data.items.map(service => `
                <div class="service-card ${service.featured ? 'featured' : ''}">
                    <span class="service-icon">${service.icon}</span>
                    <h3>${service.title}</h3>
                    <p>${service.description}</p>
                    ${service.features ? `
                        <ul class="service-features">
                            ${service.features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('');
        }
    }
}

function applyCateringContent(data) {
    if (!data) return;

    setText('#catering .section-label', data.label);

    const titleEl = document.querySelector('#catering .section-title');
    if (titleEl && data.title && data.titleHighlight) {
        titleEl.innerHTML = data.title.replace(
            data.titleHighlight,
            `<span>${data.titleHighlight}</span>`
        );
    }

    setText('#catering .section-description', data.description);
    setImage('.catering-image img', data.image);

    // Catering items
    if (data.items && data.items.length > 0) {
        const cateringGrid = document.querySelector('.catering-items');
        if (cateringGrid) {
            cateringGrid.innerHTML = data.items.map(item => `
                <div class="catering-item">
                    <span class="catering-icon">${item.icon}</span>
                    <div class="catering-info">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                </div>
            `).join('');
        }
    }
}

function applyEventsContent(data) {
    if (!data) return;

    setText('#eventos .section-label', data.label);

    const titleEl = document.querySelector('#eventos .section-title');
    if (titleEl && data.title && data.titleHighlight) {
        titleEl.innerHTML = data.title.replace(
            data.titleHighlight,
            `<span>${data.titleHighlight}</span>`
        );
    }

    setText('#eventos .section-description', data.description);

    // Event items - resolve image URLs
    if (data.items && data.items.length > 0) {
        const eventsGrid = document.querySelector('.events-grid');
        if (eventsGrid) {
            eventsGrid.innerHTML = data.items.map(event => `
                <div class="event-card ${event.popular ? 'popular' : ''}">
                    ${event.popular ? '<span class="popular-badge">Popular</span>' : ''}
                    <div class="event-image">
                        <img src="${resolveImageUrl(event.image)}" alt="${event.title}" loading="lazy">
                    </div>
                    <div class="event-content">
                        <h3>${event.title}</h3>
                        <p>${event.description}</p>
                    </div>
                </div>
            `).join('');
        }
    }
}

function applyDulcesContent(data) {
    if (!data) return;

    setText('#dulces .section-label', data.label);
    setText('#dulces .section-title', data.title);
    setText('#dulces .section-description', data.description);
    setImage('.dulces-image img', data.image);

    // Features
    if (data.features && data.features.length > 0) {
        const featuresList = document.querySelector('.dulces-features');
        if (featuresList) {
            featuresList.innerHTML = data.features.map(feature => `
                <li><span class="check-icon">✓</span> ${feature}</li>
            `).join('');
        }
    }
}

function applyCocteleriaContent(data) {
    if (!data) return;

    setText('#cocteleria .section-label', data.label);
    setText('#cocteleria .section-title', data.title);
    setText('#cocteleria .section-description', data.description);

    // Cocteleria items - resolve image URLs
    if (data.items && data.items.length > 0) {
        const cocteleriaGrid = document.querySelector('.cocteleria-grid');
        if (cocteleriaGrid) {
            cocteleriaGrid.innerHTML = data.items.map(item => `
                <div class="cocteleria-card">
                    <div class="cocteleria-image">
                        <img src="${resolveImageUrl(item.image)}" alt="${item.title}" loading="lazy">
                    </div>
                    <div class="cocteleria-content">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                    </div>
                </div>
            `).join('');
        }
    }
}

function applyGalleryContent(data) {
    if (!data) return;

    setText('#galeria .section-label', data.label);
    setText('#galeria .section-title', data.title);

    // Gallery items - resolve image URLs
    if (data.items && data.items.length > 0) {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (galleryGrid) {
            galleryGrid.innerHTML = data.items.map(item => `
                <div class="gallery-item ${item.size}">
                    <img src="${resolveImageUrl(item.image)}" alt="${item.title}" loading="lazy">
                    <div class="gallery-overlay">
                        <span>${item.title}</span>
                    </div>
                </div>
            `).join('');
        }
    }
}

function applyContactContent(data) {
    if (!data) return;

    setText('#contacto .section-label', data.label);

    const titleEl = document.querySelector('#contacto .section-title');
    if (titleEl && data.title && data.titleHighlight) {
        titleEl.innerHTML = data.title.replace(
            data.titleHighlight,
            `<span>${data.titleHighlight}</span>`
        );
    }

    setText('#contacto .section-description', data.description);
    setText('.contact-location', data.location);
    setText('.contact-email', data.email);

    // Phones
    if (data.phones && data.phones.length > 0) {
        const phonesContainer = document.querySelector('.contact-phones');
        if (phonesContainer) {
            phonesContainer.innerHTML = data.phones.map(phone => `
                <a href="tel:${phone.replace(/\s/g, '')}">${phone}</a>
            `).join(' | ');
        }
    }

    // WhatsApp button
    const whatsappBtn = document.querySelector('.whatsapp-float');
    if (whatsappBtn && data.whatsapp) {
        whatsappBtn.href = `https://wa.me/52${data.whatsapp}`;
    }

    // Facebook link
    const facebookLink = document.querySelector('.facebook-link');
    if (facebookLink && data.facebook) {
        facebookLink.href = data.facebook;
    }
}

function applyFooterContent(data) {
    if (!data) return;

    setText('.footer-description', data.description);
    setText('.footer-copyright', data.copyright);
    setText('.footer-location', data.location);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadCMSContent();
});

// Also export for manual refresh
window.refreshCMSContent = loadCMSContent;
