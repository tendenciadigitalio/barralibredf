// Mayer F&D - CMS Admin Panel JavaScript
// With Drag & Drop Image Upload Support

const API_URL = window.location.origin;
let authToken = localStorage.getItem('mayer_admin_token');
let currentSection = 'settings';
let contentData = {};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    if (authToken) {
        verifyToken();
    } else {
        showLoginScreen();
    }
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showDashboard();
            loadContent();
        } else {
            logout();
        }
    } catch (error) {
        logout();
    }
}

// ========== AUTH FUNCTIONS ==========
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateToSection(section);
        });
    });

    document.getElementById('saveBtn').addEventListener('click', saveCurrentSection);
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('mayer_admin_token', authToken);
            showDashboard();
            loadContent();
        } else {
            errorEl.textContent = data.error || 'Error al iniciar sesión';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'Error de conexión con el servidor';
        errorEl.classList.add('show');
    }
}

function logout() {
    authToken = null;
    localStorage.removeItem('mayer_admin_token');
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
}

// ========== CONTENT MANAGEMENT ==========
async function loadContent() {
    try {
        const response = await fetch(`${API_URL}/api/content`);
        contentData = await response.json();
        renderSection(currentSection);
    } catch (error) {
        showToast('Error al cargar contenido', 'error');
    }
}

function navigateToSection(section) {
    currentSection = section;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });

    const titles = {
        settings: 'Configuración General',
        hero: 'Hero Section',
        about: 'Sobre Nosotros',
        services: 'Servicios',
        catering: 'Catering',
        events: 'Eventos',
        dulces: 'Mesa de Dulces',
        cocteleria: 'Coctelería',
        gallery: 'Galería',
        contact: 'Contacto',
        images: 'Gestión de Imágenes',
        chatbot: 'Chat Widget AI'
    };
    document.getElementById('sectionTitle').textContent = titles[section] || section;

    renderSection(section);
}

function renderSection(section) {
    const contentArea = document.getElementById('contentArea');

    if (section === 'images') {
        renderImagesManager(contentArea);
        return;
    }

    if (section === 'chatbot') {
        renderChatbotEditor(contentArea);
        return;
    }

    if (section === 'settings') {
        renderSettingsEditor(contentArea, contentData.settings || {});
        setupDragAndDrop();
        return;
    }

    const data = contentData[section];
    if (!data) {
        contentArea.innerHTML = '<p>Sección no encontrada</p>';
        return;
    }

    switch (section) {
        case 'hero':
            renderHeroEditor(contentArea, data);
            break;
        case 'about':
            renderAboutEditor(contentArea, data);
            break;
        case 'services':
            renderServicesEditor(contentArea, data);
            break;
        case 'catering':
            renderCateringEditor(contentArea, data);
            break;
        case 'events':
            renderEventsEditor(contentArea, data);
            break;
        case 'dulces':
            renderDulcesEditor(contentArea, data);
            break;
        case 'cocteleria':
            renderCocteleriaEditor(contentArea, data);
            break;
        case 'gallery':
            renderGalleryEditor(contentArea, data);
            break;
        case 'contact':
            renderContactEditor(contentArea, data);
            break;
        default:
            contentArea.innerHTML = '<p>Editor no disponible para esta sección</p>';
    }

    // Setup drag and drop after rendering
    setupDragAndDrop();
}

// ========== DRAG AND DROP IMAGE UPLOAD ==========
function createImageDropZone(id, currentImage, dataPath, category) {
    const imageUrl = currentImage || '';
    const hasImage = imageUrl && imageUrl.length > 0;

    return `
        <div class="image-drop-zone" 
             data-path="${dataPath}" 
             data-category="${category}"
             id="dropzone-${id}">
            <input type="hidden" data-path="${dataPath}" value="${imageUrl}">
            <div class="drop-zone-content ${hasImage ? 'has-image' : ''}">
                ${hasImage ? `
                    <img src="${imageUrl}" alt="Preview" class="drop-zone-preview">
                    <div class="drop-zone-overlay">
                        <span>🔄 Arrastra para cambiar</span>
                        <button type="button" class="btn-remove-image" onclick="removeImage('${id}', '${dataPath}')">✕ Quitar</button>
                    </div>
                ` : `
                    <div class="drop-zone-placeholder">
                        <div class="drop-icon">📁</div>
                        <p>Arrastra una imagen aquí</p>
                        <span>o haz clic para seleccionar</span>
                        <input type="file" accept="image/*" class="drop-zone-input" onchange="handleFileSelect(event, '${id}', '${dataPath}', '${category}')">
                    </div>
                `}
            </div>
        </div>
    `;
}

function setupDragAndDrop() {
    const dropZones = document.querySelectorAll('.image-drop-zone');

    dropZones.forEach(zone => {
        // Remove existing listeners to avoid duplicates
        zone.removeEventListener('dragover', handleDragOver);
        zone.removeEventListener('dragleave', handleDragLeave);
        zone.removeEventListener('drop', handleDrop);
        zone.removeEventListener('click', handleZoneClick);

        // Add listeners
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('click', handleZoneClick);
    });
}

// Alias for compatibility or centralized setup
function setupAllDropZones() {
    setupDragAndDrop();
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
}

async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
        showToast('Solo se permiten archivos de imagen', 'error');
        return;
    }

    const dataPath = this.dataset.path;
    const category = this.dataset.category;
    const zoneId = this.id.replace('dropzone-', '');

    await uploadImageFile(file, zoneId, dataPath, category);
}

function handleZoneClick(e) {
    if (e.target.classList.contains('btn-remove-image')) return;
    const input = this.querySelector('.drop-zone-input');
    if (input) input.click();
}

async function handleFileSelect(e, zoneId, dataPath, category) {
    const file = e.target.files[0];
    if (!file) return;

    await uploadImageFile(file, zoneId, dataPath, category);
}

async function uploadImageFile(file, zoneId, dataPath, category) {
    const zone = document.getElementById(`dropzone-${zoneId}`);
    zone.classList.add('uploading');

    try {
        // Convert to base64
        const base64 = await fileToBase64(file);

        const response = await fetch(`${API_URL}/api/upload-base64/${category}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                imageData: base64,
                filename: file.name
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Update the drop zone with new image
            updateDropZone(zoneId, data.url, dataPath, category);
            showToast('Imagen subida correctamente', 'success');
        } else {
            showToast(data.error || 'Error al subir imagen', 'error');
        }
    } catch (error) {
        showToast('Error al subir la imagen', 'error');
        console.error('Upload error:', error);
    } finally {
        zone.classList.remove('uploading');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function updateDropZone(zoneId, imageUrl, dataPath, category) {
    const zone = document.getElementById(`dropzone-${zoneId}`);
    if (!zone) return;

    zone.innerHTML = `
        <input type="hidden" data-path="${dataPath}" value="${imageUrl}">
        <div class="drop-zone-content has-image">
            <img src="${imageUrl}" alt="Preview" class="drop-zone-preview">
            <div class="drop-zone-overlay">
                <span>🔄 Arrastra para cambiar</span>
                <button type="button" class="btn-remove-image" onclick="removeImage('${zoneId}', '${dataPath}')">✕ Quitar</button>
            </div>
        </div>
    `;

    setupDragAndDrop();
}

function removeImage(zoneId, dataPath) {
    const zone = document.getElementById(`dropzone-${zoneId}`);
    if (!zone) return;

    const category = zone.dataset.category;

    zone.innerHTML = `
        <input type="hidden" data-path="${dataPath}" value="">
        <div class="drop-zone-content">
            <div class="drop-zone-placeholder">
                <div class="drop-icon">📁</div>
                <p>Arrastra una imagen aquí</p>
                <span>o haz clic para seleccionar</span>
                <input type="file" accept="image/*" class="drop-zone-input" onchange="handleFileSelect(event, '${zoneId}', '${dataPath}', '${category}')">
            </div>
        </div>
    `;

    setupDragAndDrop();
    showToast('Imagen removida (guarda para aplicar cambios)', 'info');
}

// ========== SECTION EDITORS ==========

function renderSettingsEditor(container, data) {
    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">🏢 Identidad de Marca</h3>
            <p class="editor-hint">Configura el logo y nombre que aparece en el navbar y footer</p>
            
            <div class="form-group">
                <label>Nombre del Sitio</label>
                <input type="text" value="${data.siteName || 'Mayer F&D'}" data-path="siteName">
            </div>
            
            <div class="form-group">
                <label>Nombre Secundario (opcional)</label>
                <input type="text" value="${data.siteNameSecondary || ''}" data-path="siteNameSecondary">
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🖼️ Logo del Sitio</h3>
            <p class="editor-hint">Arrastra y suelta tu logo aquí. Formatos recomendados: PNG o SVG transparente</p>
            
            <div class="form-group">
                <label>Logo Principal</label>
                ${createImageDropZone('settings-logo', data.logo, 'logo', 'hero')}
            </div>
            
            <div class="form-group">
                <label>Logo en Footer (opcional)</label>
                ${createImageDropZone('settings-logo-footer', data.logoFooter, 'logoFooter', 'hero')}
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🎨 Colores (próximamente)</h3>
            <p class="editor-hint">La personalización de colores estará disponible pronto</p>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">📱 Favicon</h3>
            <div class="form-group">
                <label>Favicon del Sitio</label>
                ${createImageDropZone('settings-favicon', data.favicon, 'favicon', 'hero')}
            </div>
        </div>
    `;
}

function renderHeroEditor(container, data) {
    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📝 Textos del Hero</h3>
            <div class="form-group">
                <label>Etiqueta Superior</label>
                <input type="text" id="hero-label" value="${data.label || ''}" data-path="label">
            </div>
            <div class="form-group">
                <label>Título - Línea 1</label>
                <input type="text" value="${data.title?.line1 || ''}" data-path="title.line1">
            </div>
            <div class="form-group">
                <label>Título - Línea 2 (Destacado)</label>
                <input type="text" value="${data.title?.line2 || ''}" data-path="title.line2">
            </div>
            <div class="form-group">
                <label>Título - Línea 3</label>
                <input type="text" value="${data.title?.line3 || ''}" data-path="title.line3">
            </div>
            <div class="form-group">
                <label>Título - Línea 4 (Destacado)</label>
                <input type="text" value="${data.title?.line4 || ''}" data-path="title.line4">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea data-path="description">${data.description || ''}</textarea>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">📊 Estadísticas</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Stat 1 - Valor</label>
                    <input type="text" value="${data.stats?.[0]?.value || ''}" data-path="stats.0.value">
                </div>
                <div class="form-group">
                    <label>Stat 1 - Etiqueta</label>
                    <input type="text" value="${data.stats?.[0]?.label || ''}" data-path="stats.0.label">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Stat 2 - Valor</label>
                    <input type="text" value="${data.stats?.[1]?.value || ''}" data-path="stats.1.value">
                </div>
                <div class="form-group">
                    <label>Stat 2 - Etiqueta</label>
                    <input type="text" value="${data.stats?.[1]?.label || ''}" data-path="stats.1.label">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Stat 3 - Valor</label>
                    <input type="text" value="${data.stats?.[2]?.value || ''}" data-path="stats.2.value">
                </div>
                <div class="form-group">
                    <label>Stat 3 - Etiqueta</label>
                    <input type="text" value="${data.stats?.[2]?.label || ''}" data-path="stats.2.label">
                </div>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🖼️ Imágenes del Hero</h3>
            <p class="editor-hint">Arrastra y suelta imágenes en las zonas de abajo</p>
            <div class="form-group">
                <label>Imagen Principal</label>
                ${createImageDropZone('hero-main', data.images?.main, 'images.main', 'hero')}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Imagen Flotante 1</label>
                    ${createImageDropZone('hero-float1', data.images?.float1, 'images.float1', 'hero')}
                </div>
                <div class="form-group">
                    <label>Imagen Flotante 2</label>
                    ${createImageDropZone('hero-float2', data.images?.float2, 'images.float2', 'hero')}
                </div>
            </div>
        </div>
    `;
}

function renderAboutEditor(container, data) {
    let featuresHtml = '';
    (data.features || []).forEach((feature, index) => {
        featuresHtml += `
            <div class="item-card">
                <div class="item-card-header">
                    <span class="item-card-title">${feature.icon} ${feature.title}</span>
                </div>
                <div class="form-group">
                    <label>Icono (emoji)</label>
                    <input type="text" value="${feature.icon}" data-path="features.${index}.icon">
                </div>
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" value="${feature.title}" data-path="features.${index}.title">
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <input type="text" value="${feature.description}" data-path="features.${index}.description">
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📝 Textos</h3>
            <div class="form-group">
                <label>Etiqueta</label>
                <input type="text" value="${data.label || ''}" data-path="label">
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" value="${data.title || ''}" data-path="title">
            </div>
            <div class="form-group">
                <label>Palabra Destacada</label>
                <input type="text" value="${data.titleHighlight || ''}" data-path="titleHighlight">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea data-path="description">${data.description || ''}</textarea>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🖼️ Imagen</h3>
            <div class="form-group">
                <label>Imagen de la Sección</label>
                ${createImageDropZone('about-main', data.image, 'image', 'about')}
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">✨ Características</h3>
            <div class="items-list">${featuresHtml}</div>
        </div>
    `;
}

function renderServicesEditor(container, data) {
    let servicesHtml = '';
    (data.items || []).forEach((service, index) => {
        servicesHtml += `
            <div class="item-card" data-service-index="${index}">
                <div class="item-card-header">
                    <span class="item-card-title">${service.icon || '🍽️'} ${service.title || 'Nuevo Servicio'}</span>
                    <button type="button" class="btn-delete-service" onclick="deleteService(${index})" title="Eliminar servicio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="form-group">
                    <label>Imagen del Servicio</label>
                    ${createImageDropZone(`service-${index}`, service.image, `items.${index}.image`, 'services')}
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Icono (emoji)</label>
                        <input type="text" value="${service.icon || ''}" data-path="items.${index}.icon" placeholder="🍽️">
                    </div>
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" value="${service.title || ''}" data-path="items.${index}.title" placeholder="Nombre del servicio">
                    </div>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea data-path="items.${index}.description" placeholder="Describe el servicio...">${service.description || ''}</textarea>
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📝 Encabezado de la Sección</h3>
            <div class="form-group">
                <label>Etiqueta</label>
                <input type="text" value="${data.label || ''}" data-path="label" placeholder="Ej: Nuestros Servicios">
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" value="${data.title || ''}" data-path="title" placeholder="Ej: Soluciones integrales para tu evento">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea data-path="description" placeholder="Descripción de la sección...">${data.description || ''}</textarea>
            </div>
        </div>
        
        <div class="editor-section">
            <div class="section-header-with-button">
                <h3 class="editor-section-title">🍽️ Servicios</h3>
                <button type="button" class="btn-add-item" onclick="addNewService()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Agregar Servicio
                </button>
            </div>
            <p class="section-help-text">Arrastra imágenes a cada servicio o haz clic para seleccionar. Puedes agregar, editar o eliminar servicios.</p>
            <div class="items-list" id="servicesList">${servicesHtml}</div>
        </div>
    `;

    // Re-setup drag and drop for new elements
    setupDragAndDrop();
}

// Add new service function
function addNewService() {
    if (!contentData.services) {
        contentData.services = { items: [] };
    }
    if (!contentData.services.items) {
        contentData.services.items = [];
    }

    contentData.services.items.push({
        icon: '🍽️',
        title: 'Nuevo Servicio',
        description: 'Descripción del servicio...',
        image: ''
    });

    // Re-render the section
    const contentArea = document.getElementById('contentArea');
    renderServicesEditor(contentArea, contentData.services);

    showNotification('Servicio agregado. No olvides guardarlo.', 'info');
}

// Delete service function
function deleteService(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
        contentData.services.items.splice(index, 1);

        // Re-render the section
        const contentArea = document.getElementById('contentArea');
        renderServicesEditor(contentArea, contentData.services);

        showNotification('Servicio eliminado. Guarda los cambios.', 'warning');
    }
}

function renderCateringEditor(container, data) {
    let itemsHtml = '';
    (data.items || []).forEach((item, index) => {
        itemsHtml += `
            <div class="item-card">
                <div class="item-card-header">
                    <span class="item-card-title">${item.icon} ${item.title}</span>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Icono</label>
                        <input type="text" value="${item.icon}" data-path="items.${index}.icon">
                    </div>
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" value="${item.title}" data-path="items.${index}.title">
                    </div>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <input type="text" value="${item.description}" data-path="items.${index}.description">
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📝 Encabezado</h3>
            <div class="form-group">
                <label>Etiqueta</label>
                <input type="text" value="${data.label || ''}" data-path="label">
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" value="${data.title || ''}" data-path="title">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea data-path="description">${data.description || ''}</textarea>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🖼️ Imagen</h3>
            <div class="form-group">
                <label>Imagen de Catering</label>
                ${createImageDropZone('catering-main', data.image, 'image', 'catering')}
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🍽️ Items de Catering</h3>
            <div class="items-list">${itemsHtml}</div>
        </div>
    `;
}

function renderEventsEditor(container, data) {
    let eventsHtml = '';
    (data.items || []).forEach((event, index) => {
        eventsHtml += `
            <div class="item-card">
                <div class="item-card-header">
                    <span class="item-card-title">🎉 ${event.title}</span>
                </div>
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" value="${event.title}" data-path="items.${index}.title">
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <input type="text" value="${event.description}" data-path="items.${index}.description">
                </div>
                <div class="form-group">
                    <label>Imagen del Evento</label>
                    ${createImageDropZone(`event-${index}`, event.image, `items.${index}.image`, 'events')}
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📝 Encabezado</h3>
            <div class="form-group">
                <label>Etiqueta</label>
                <input type="text" value="${data.label || ''}" data-path="label">
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" value="${data.title || ''}" data-path="title">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea data-path="description">${data.description || ''}</textarea>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🎉 Tipos de Eventos</h3>
            <div class="items-list">${eventsHtml}</div>
        </div>
    `;
}

function renderDulcesEditor(container, data) {
    let featuresHtml = '';
    (data.features || []).forEach((feature, index) => {
        featuresHtml += `
            <div class="form-group">
                <label>Característica ${index + 1}</label>
                <input type="text" value="${feature}" data-path="features.${index}">
            </div>
        `;
    });

    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📝 Textos</h3>
            <div class="form-group">
                <label>Etiqueta</label>
                <input type="text" value="${data.label || ''}" data-path="label">
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" value="${data.title || ''}" data-path="title">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea data-path="description">${data.description || ''}</textarea>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🖼️ Imagen</h3>
            <div class="form-group">
                <label>Imagen de Mesa de Dulces</label>
                ${createImageDropZone('dulces-main', data.image, 'image', 'dulces')}
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">✨ Características</h3>
            ${featuresHtml}
        </div>
    `;
}

function renderCocteleriaEditor(container, data) {
    let itemsHtml = '';
    (data.items || []).forEach((item, index) => {
        itemsHtml += `
            <div class="item-card">
                <div class="item-card-header">
                    <span class="item-card-title">🍸 ${item.title}</span>
                </div>
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" value="${item.title}" data-path="items.${index}.title">
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <input type="text" value="${item.description}" data-path="items.${index}.description">
                </div>
                <div class="form-group">
                    <label>Imagen</label>
                    ${createImageDropZone(`cocteleria-${index}`, item.image, `items.${index}.image`, 'cocteleria')}
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📝 Encabezado</h3>
            <div class="form-group">
                <label>Etiqueta</label>
                <input type="text" value="${data.label || ''}" data-path="label">
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" value="${data.title || ''}" data-path="title">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea data-path="description">${data.description || ''}</textarea>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🍸 Tipos de Coctelería</h3>
            <div class="items-list">${itemsHtml}</div>
        </div>
    `;
}

function renderGalleryEditor(container, data) {
    let itemsHtml = '';
    (data.items || []).forEach((item, index) => {
        itemsHtml += `
            <div class="item-card">
                <div class="item-card-header">
                    <span class="item-card-title">📷 ${item.title}</span>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" value="${item.title}" data-path="items.${index}.title">
                    </div>
                    <div class="form-group">
                        <label>Tamaño</label>
                        <select data-path="items.${index}.size">
                            <option value="normal" ${item.size === 'normal' ? 'selected' : ''}>Normal</option>
                            <option value="big" ${item.size === 'big' ? 'selected' : ''}>Grande</option>
                            <option value="tall" ${item.size === 'tall' ? 'selected' : ''}>Alto</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Imagen</label>
                    ${createImageDropZone(`gallery-${index}`, item.image, `items.${index}.image`, 'gallery')}
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📝 Encabezado</h3>
            <div class="form-group">
                <label>Etiqueta</label>
                <input type="text" value="${data.label || ''}" data-path="label">
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" value="${data.title || ''}" data-path="title">
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">📷 Imágenes de Galería</h3>
            <div class="items-list">${itemsHtml}</div>
        </div>
    `;
}

function renderContactEditor(container, data) {
    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📝 Textos</h3>
            <div class="form-group">
                <label>Etiqueta</label>
                <input type="text" value="${data.label || ''}" data-path="label">
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" value="${data.title || ''}" data-path="title">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea data-path="description">${data.description || ''}</textarea>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">📍 Información de Contacto</h3>
            <div class="form-group">
                <label>Ubicación</label>
                <input type="text" value="${data.location || ''}" data-path="location">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" value="${data.email || ''}" data-path="email">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Teléfono 1</label>
                    <input type="text" value="${data.phones?.[0] || ''}" data-path="phones.0">
                </div>
                <div class="form-group">
                    <label>Teléfono 2</label>
                    <input type="text" value="${data.phones?.[1] || ''}" data-path="phones.1">
                </div>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🔗 Redes Sociales</h3>
            <div class="form-group">
                <label>Facebook URL</label>
                <input type="url" value="${data.facebook || ''}" data-path="facebook">
            </div>
            <div class="form-group">
                <label>WhatsApp (número)</label>
                <input type="text" value="${data.whatsapp || ''}" data-path="whatsapp">
            </div>
        </div>
    `;
}

// ========== IMAGES MANAGER ==========
async function renderImagesManager(container) {
    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">📤 Subir Nueva Imagen</h3>
            <div class="form-group">
                <label>Categoría</label>
                <select id="uploadCategory">
                    <option value="hero">Hero</option>
                    <option value="about">Sobre Nosotros</option>
                    <option value="services">Servicios</option>
                    <option value="catering">Catering</option>
                    <option value="events">Eventos</option>
                    <option value="dulces">Mesa de Dulces</option>
                    <option value="cocteleria">Coctelería</option>
                    <option value="gallery" selected>Galería</option>
                    <option value="contact">Contacto</option>
                </select>
            </div>
            <div class="image-drop-zone large-drop-zone" id="dropzone-manager" data-category="gallery">
                <div class="drop-zone-content">
                    <div class="drop-zone-placeholder">
                        <div class="drop-icon">📁</div>
                        <p>Arrastra imágenes aquí</p>
                        <span>o haz clic para seleccionar</span>
                        <input type="file" accept="image/*" multiple class="drop-zone-input" id="managerFileInput">
                    </div>
                </div>
            </div>
        </div>
        
        <div class="editor-section">
            <h3 class="editor-section-title">🖼️ Imágenes Subidas</h3>
            <div class="category-tabs" id="categoryTabs">
                <button class="category-tab active" data-cat="all">Todas</button>
                <button class="category-tab" data-cat="hero">Hero</button>
                <button class="category-tab" data-cat="about">About</button>
                <button class="category-tab" data-cat="events">Eventos</button>
                <button class="category-tab" data-cat="gallery">Galería</button>
            </div>
            <div id="imagesGrid" class="images-grid">
                <p>Cargando imágenes...</p>
            </div>
        </div>
    `;

    // Setup manager drop zone
    const managerZone = document.getElementById('dropzone-manager');
    const categorySelect = document.getElementById('uploadCategory');
    const fileInput = document.getElementById('managerFileInput');

    categorySelect.addEventListener('change', (e) => {
        managerZone.dataset.category = e.target.value;
    });

    managerZone.addEventListener('dragover', handleDragOver);
    managerZone.addEventListener('dragleave', handleDragLeave);
    managerZone.addEventListener('drop', handleManagerDrop);
    managerZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', handleManagerFileSelect);

    // Setup category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            loadUploadedImages(e.target.dataset.cat);
        });
    });

    loadUploadedImages('all');
}

async function handleManagerDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const category = document.getElementById('uploadCategory').value;

    for (const file of files) {
        await uploadManagerFile(file, category);
    }

    loadUploadedImages('all');
}

async function handleManagerFileSelect(e) {
    const files = Array.from(e.target.files);
    const category = document.getElementById('uploadCategory').value;

    for (const file of files) {
        await uploadManagerFile(file, category);
    }

    loadUploadedImages('all');
}

async function uploadManagerFile(file, category) {
    try {
        const base64 = await fileToBase64(file);

        const response = await fetch(`${API_URL}/api/upload-base64/${category}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                imageData: base64,
                filename: file.name
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast(`Imagen subida a ${category}`, 'success');
        } else {
            showToast(data.error || 'Error al subir imagen', 'error');
        }
    } catch (error) {
        showToast('Error al subir la imagen', 'error');
    }
}

async function loadUploadedImages(category = 'all') {
    try {
        const url = category === 'all' ? `${API_URL}/api/images` : `${API_URL}/api/images/${category}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const images = await response.json();
        const grid = document.getElementById('imagesGrid');

        if (images.length === 0) {
            grid.innerHTML = '<p style="color: var(--white-muted);">No hay imágenes en esta categoría</p>';
            return;
        }

        grid.innerHTML = images.map(img => `
            <div class="image-card">
                <img src="${img.url}" alt="${img.filename}" loading="lazy">
                <div class="image-card-info">
                    <span class="image-card-category">${img.category}</span>
                    <div class="image-card-actions">
                        <button class="btn-copy" onclick="copyToClipboard('${img.url}')">📋 URL</button>
                        <button class="btn-delete" onclick="deleteImage('${img.category}', '${img.filename}')">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('imagesGrid').innerHTML = '<p style="color: var(--error);">Error al cargar imágenes</p>';
    }
}

async function deleteImage(category, filename) {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
        const response = await fetch(`${API_URL}/api/images/${category}/${filename}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showToast('Imagen eliminada', 'success');
            loadUploadedImages(document.querySelector('.category-tab.active').dataset.cat);
        } else {
            showToast('Error al eliminar imagen', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('URL copiada al portapapeles', 'success');
    });
}

// ========== CHATBOT EDITOR ==========
let chatConfig = {};

async function loadChatConfig() {
    try {
        const response = await fetch(`${API_URL}/api/chat-config`);
        chatConfig = await response.json();
        return chatConfig;
    } catch (error) {
        console.error('Error loading chat config:', error);
        return {};
    }
}

async function renderChatbotEditor(container) {
    // Cargar configuración actual del chat
    await loadChatConfig();

    const data = chatConfig;
    const colors = data.colors || {};
    const messages = data.messages || {};
    const callToActions = data.callToActions || [];

    let ctaHtml = '';
    callToActions.forEach((cta, index) => {
        ctaHtml += `
            <div class="item-card cta-item" data-cta-index="${index}">
                <div class="item-card-header">
                    <span class="item-card-title">${cta.text}</span>
                    <button type="button" class="btn-delete-service" onclick="deleteCta(${index})" title="Eliminar CTA">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Texto del Botón</label>
                        <input type="text" value="${cta.text}" data-chat-path="callToActions.${index}.text" placeholder="📋 Solicitar Cotización">
                    </div>
                    <div class="form-group">
                        <label>Acción (ID)</label>
                        <input type="text" value="${cta.action}" data-chat-path="callToActions.${index}.action" placeholder="cotizacion">
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="editor-section">
            <h3 class="editor-section-title">🌐 Conexión del Webhook</h3>
            <p class="editor-hint">URL del webhook donde se enviarán los mensajes del chat</p>
            <div class="form-group">
                <label>URL del Webhook</label>
                <input type="text" value="${data.webhookUrl || ''}" data-chat-path="webhookUrl" placeholder="https://tu-webhook.com/endpoint">
            </div>
        </div>

        <div class="editor-section">
            <h3 class="editor-section-title">📍 Posición del Widget</h3>
            <div class="form-group">
                <label>Posición en pantalla</label>
                <select data-chat-path="position">
                    <option value="bottom-right" ${data.position === 'bottom-right' ? 'selected' : ''}>Abajo Derecha</option>
                    <option value="bottom-left" ${data.position === 'bottom-left' ? 'selected' : ''}>Abajo Izquierda</option>
                    <option value="top-right" ${data.position === 'top-right' ? 'selected' : ''}>Arriba Derecha</option>
                    <option value="top-left" ${data.position === 'top-left' ? 'selected' : ''}>Arriba Izquierda</option>
                </select>
            </div>
        </div>

        <div class="editor-section">
            <h3 class="editor-section-title">🎨 Colores del Widget</h3>
            <p class="editor-hint">Personaliza los colores del chat para que coincidan con tu marca</p>
            <div class="form-row">
                <div class="form-group">
                    <label>Color Primario</label>
                    <div class="color-input-group">
                        <input type="color" value="${colors.primary || '#c9a76c'}" data-chat-path="colors.primary" class="color-picker">
                        <input type="text" value="${colors.primary || '#c9a76c'}" data-chat-path="colors.primary" class="color-text" placeholder="#c9a76c">
                    </div>
                </div>
                <div class="form-group">
                    <label>Color Secundario</label>
                    <div class="color-input-group">
                        <input type="color" value="${colors.secondary || '#1a1a1a'}" data-chat-path="colors.secondary" class="color-picker">
                        <input type="text" value="${colors.secondary || '#1a1a1a'}" data-chat-path="colors.secondary" class="color-text" placeholder="#1a1a1a">
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Color de Burbuja del Bot</label>
                    <div class="color-input-group">
                        <input type="color" value="${colors.botBubble || '#f8f5f0'}" data-chat-path="colors.botBubble" class="color-picker">
                        <input type="text" value="${colors.botBubble || '#f8f5f0'}" data-chat-path="colors.botBubble" class="color-text" placeholder="#f8f5f0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Color de Burbuja del Usuario</label>
                    <div class="color-input-group">
                        <input type="color" value="${colors.userBubble || '#c9a76c'}" data-chat-path="colors.userBubble" class="color-picker">
                        <input type="text" value="${colors.userBubble || '#c9a76c'}" data-chat-path="colors.userBubble" class="color-text" placeholder="#c9a76c">
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Color Texto del Bot</label>
                    <div class="color-input-group">
                        <input type="color" value="${colors.botText || '#333333'}" data-chat-path="colors.botText" class="color-picker">
                        <input type="text" value="${colors.botText || '#333333'}" data-chat-path="colors.botText" class="color-text" placeholder="#333333">
                    </div>
                </div>
                <div class="form-group">
                    <label>Color Texto del Usuario</label>
                    <div class="color-input-group">
                        <input type="color" value="${colors.userText || '#ffffff'}" data-chat-path="colors.userText" class="color-picker">
                        <input type="text" value="${colors.userText || '#ffffff'}" data-chat-path="colors.userText" class="color-text" placeholder="#ffffff">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Gradiente del Header</label>
                <input type="text" value="${colors.headerGradient || 'linear-gradient(135deg, #c9a76c 0%, #d4b67d 50%, #c9a76c 100%)'}" data-chat-path="colors.headerGradient" placeholder="linear-gradient(135deg, #c9a76c 0%, #d4b67d 50%, #c9a76c 100%)">
            </div>
        </div>

        <div class="editor-section">
            <h3 class="editor-section-title">💬 Mensajes del Chat</h3>
            <div class="form-group">
                <label>Mensaje de Bienvenida</label>
                <textarea data-chat-path="messages.welcomeMessage" rows="3" placeholder="¡Hola! 👋 Soy tu asistente...">${messages.welcomeMessage || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Indicador de Typing (Animación)</label>
                    <input type="text" value="${messages.typingIndicator || ''}" data-chat-path="messages.typingIndicator" placeholder="Habla conmigo">
                </div>
                <div class="form-group">
                    <label>Texto "Powered by"</label>
                    <input type="text" value="${messages.poweredBy || ''}" data-chat-path="messages.poweredBy" placeholder="Mayer F&D">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Título del Header</label>
                    <input type="text" value="${messages.headerTitle || ''}" data-chat-path="messages.headerTitle" placeholder="¡Chatea con nosotros!">
                </div>
                <div class="form-group">
                    <label>Subtítulo del Header</label>
                    <input type="text" value="${messages.headerSubtitle || ''}" data-chat-path="messages.headerSubtitle" placeholder="¡Estamos en línea!">
                </div>
            </div>
            <div class="form-group">
                <label>Placeholder del Input</label>
                <input type="text" value="${messages.inputPlaceholder || ''}" data-chat-path="messages.inputPlaceholder" placeholder="Escribe tu mensaje...">
            </div>
        </div>

        <div class="editor-section">
            <div class="section-header-with-button">
                <h3 class="editor-section-title">🎯 Call-to-Actions (Botones Rápidos)</h3>
                <button type="button" class="btn-add-item" onclick="addNewCta()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Agregar CTA
                </button>
            </div>
            <p class="editor-hint">Botones de acceso rápido que aparecen en el chat</p>
            <div class="items-list" id="ctaList">${ctaHtml}</div>
        </div>

        <div class="editor-section">
            <h3 class="editor-section-title">⚙️ Opciones Adicionales</h3>
            <div class="form-row">
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" ${data.showTypingAnimation ? 'checked' : ''} data-chat-path="showTypingAnimation">
                        Mostrar animación de typing
                    </label>
                </div>
                <div class="form-group">
                    <label>Auto-abrir después de (ms, 0 = desactivado)</label>
                    <input type="number" value="${data.autoOpenDelay || 0}" data-chat-path="autoOpenDelay" min="0" step="1000" placeholder="0">
                </div>
            </div>
            <div class="form-group">
                <label>Icono del Bot (URL de imagen, dejar vacío para usar icono por defecto)</label>
                <input type="text" value="${data.botIcon || ''}" data-chat-path="botIcon" placeholder="https://ejemplo.com/bot-avatar.png">
            </div>
        </div>

        <div class="editor-section actions-section">
            <button type="button" class="btn-reset-chat" onclick="resetChatConfig()">
                🔄 Restablecer a valores por defecto
            </button>
        </div>
    `;

    // Sincronizar color pickers con inputs de texto
    setupColorSyncListeners();
}

function setupColorSyncListeners() {
    const colorPickers = document.querySelectorAll('.color-picker');
    colorPickers.forEach(picker => {
        picker.addEventListener('input', (e) => {
            const textInput = e.target.parentElement.querySelector('.color-text');
            if (textInput) {
                textInput.value = e.target.value;
            }
        });
    });

    const colorTexts = document.querySelectorAll('.color-text');
    colorTexts.forEach(textInput => {
        textInput.addEventListener('input', (e) => {
            const picker = e.target.parentElement.querySelector('.color-picker');
            if (picker && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                picker.value = e.target.value;
            }
        });
    });
}

function addNewCta() {
    if (!chatConfig.callToActions) {
        chatConfig.callToActions = [];
    }

    chatConfig.callToActions.push({
        text: '✨ Nuevo Botón',
        action: 'nuevo_action'
    });

    // Re-render
    const contentArea = document.getElementById('contentArea');
    renderChatbotEditor(contentArea);

    showToast('CTA agregado. No olvides guardar los cambios.', 'info');
}

function deleteCta(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este CTA?')) {
        chatConfig.callToActions.splice(index, 1);

        // Re-render
        const contentArea = document.getElementById('contentArea');
        renderChatbotEditor(contentArea);

        showToast('CTA eliminado. Guarda los cambios.', 'warning');
    }
}

async function saveChatConfig() {
    const contentArea = document.getElementById('contentArea');
    const inputs = contentArea.querySelectorAll('[data-chat-path]');
    const updates = {};

    inputs.forEach(input => {
        const path = input.dataset.chatPath;
        let value;

        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'number') {
            value = parseInt(input.value) || 0;
        } else {
            value = input.value;
        }

        // Solo usar el primer input para paths duplicados (color pickers)
        if (input.classList.contains('color-text')) {
            setNestedValue(updates, path, value);
        } else if (!input.classList.contains('color-picker') || !contentArea.querySelector(`.color-text[data-chat-path="${path}"]`)) {
            setNestedValue(updates, path, value);
        }
    });

    try {
        const response = await fetch(`${API_URL}/api/chat-config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (response.ok) {
            chatConfig = data.data;
            showToast('Configuración del chat guardada correctamente', 'success');
        } else {
            showToast(data.error || 'Error al guardar', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

async function resetChatConfig() {
    if (!confirm('¿Estás seguro de que quieres restablecer la configuración del chat a los valores por defecto? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/chat-config/reset`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            chatConfig = data.data;
            const contentArea = document.getElementById('contentArea');
            renderChatbotEditor(contentArea);
            showToast('Configuración del chat restablecida', 'success');
        } else {
            showToast(data.error || 'Error al restablecer', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

// ========== SAVE FUNCTIONALITY ==========
async function saveCurrentSection() {
    if (currentSection === 'images') {
        showToast('No hay cambios que guardar en esta sección', 'warning');
        return;
    }

    if (currentSection === 'chatbot') {
        await saveChatConfig();
        return;
    }

    const contentArea = document.getElementById('contentArea');
    const inputs = contentArea.querySelectorAll('[data-path]');
    const updates = {};

    inputs.forEach(input => {
        const path = input.dataset.path;
        const value = input.type === 'checkbox' ? input.checked : input.value;
        setNestedValue(updates, path, value);
    });

    try {
        const response = await fetch(`${API_URL}/api/content/${currentSection}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (response.ok) {
            contentData[currentSection] = data.data;
            showToast('Cambios guardados correctamente', 'success');
        } else {
            showToast(data.error || 'Error al guardar', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
            current[key] = isNaN(keys[i + 1]) ? {} : [];
        }
        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
