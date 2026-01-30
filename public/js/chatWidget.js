/**
 * Mayer F&D - AI Chat Widget
 * Widget de chat inteligente con personalización desde backend
 */

class MayerChatWidget {
    constructor(config = {}) {
        // Configuración por defecto (se sobrescribe con datos del backend)
        this.config = {
            webhookUrl: 'https://tdn8n.tendenciadigital.top/webhook/barralibred571eaba-b047-4645-a7d8-237e7b327dfa',
            position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
            colors: {
                primary: '#c9a76c',
                primaryHover: '#d4b67d',
                secondary: '#1a1a1a',
                background: '#ffffff',
                text: '#333333',
                botBubble: '#f8f5f0',
                userBubble: '#c9a76c',
                botText: '#333333',
                userText: '#ffffff',
                headerGradient: 'linear-gradient(135deg, #c9a76c 0%, #d4b67d 50%, #c9a76c 100%)'
            },
            messages: {
                welcomeMessage: '¡Hola! 👋 Soy tu asistente de Mayer F&D. ¿En qué puedo ayudarte hoy?',
                typingIndicator: 'Habla conmigo',
                headerTitle: '¡Chatea con nosotros!',
                headerSubtitle: '¡Estamos en línea!',
                inputPlaceholder: 'Escribe tu mensaje...',
                poweredBy: 'Mayer F&D'
            },
            callToActions: [
                { text: '📋 Solicitar Cotización', action: 'cotizacion' },
                { text: '🍸 Barra Libre', action: 'barra_libre' },
                { text: '🍬 Mesa de Dulces', action: 'mesa_dulces' },
                { text: '📞 Contactar', action: 'contactar' }
            ],
            botIcon: null, // URL de ícono personalizado o null para usar el default
            showTypingAnimation: true,
            autoOpenDelay: 0, // 0 = no auto-open, número = ms antes de abrir
            ...config
        };

        this.isOpen = false;
        this.isVisible = false;
        this.messages = [];
        this.isLoading = false;
        this.typingText = '';
        this.typingInterval = null;
        this.sessionId = this.generateSessionId();

        this.init();
    }

    generateSessionId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async init() {
        // Intentar cargar configuración del backend
        await this.loadConfig();

        // Crear elementos del widget
        this.createStyles();
        this.createWidget();
        this.attachEventListeners();

        // Agregar mensaje de bienvenida
        this.addMessage(this.config.messages.welcomeMessage, false);

        // Mostrar widget con animación
        setTimeout(() => {
            this.isVisible = true;
            this.widgetContainer.classList.add('mayer-chat-visible');
        }, 500);

        // Auto-open si está configurado
        if (this.config.autoOpenDelay > 0) {
            setTimeout(() => {
                if (!this.isOpen) this.toggleChat();
            }, this.config.autoOpenDelay);
        }

        // Iniciar animación de typing
        if (this.config.showTypingAnimation) {
            this.startTypingAnimation();
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/chat-config');
            if (response.ok) {
                const backendConfig = await response.json();
                this.config = { ...this.config, ...backendConfig };
            }
        } catch (error) {
            console.log('Using default chat configuration');
        }
    }

    createStyles() {
        const styleId = 'mayer-chat-styles';
        if (document.getElementById(styleId)) return;

        const colors = this.config.colors;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Mayer Chat Widget - Container */
            .mayer-chat-container {
                position: fixed;
                z-index: 9999;
                font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .mayer-chat-container.mayer-chat-visible {
                opacity: 1;
                transform: scale(1);
            }

            /* Position variants */
            .mayer-chat-container.position-bottom-right {
                bottom: 24px;
                right: 24px;
            }

            .mayer-chat-container.position-bottom-left {
                bottom: 24px;
                left: 24px;
            }

            .mayer-chat-container.position-top-right {
                top: 24px;
                right: 24px;
            }

            .mayer-chat-container.position-top-left {
                top: 24px;
                left: 24px;
            }

            /* Chat Button */
            .mayer-chat-button {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                background: ${colors.headerGradient};
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 32px rgba(201, 167, 108, 0.4);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                animation: mayer-float 3s ease-in-out infinite;
                position: relative;
                overflow: hidden;
            }

            .mayer-chat-button:hover {
                transform: scale(1.1);
                box-shadow: 0 12px 40px rgba(201, 167, 108, 0.5);
            }

            .mayer-chat-button::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                transform: rotate(45deg);
                animation: mayer-shimmer 3s ease-in-out infinite;
            }

            .mayer-chat-button svg {
                width: 28px;
                height: 28px;
                fill: white;
                position: relative;
                z-index: 1;
            }

            .mayer-chat-button img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
                position: relative;
                z-index: 1;
            }

            /* Typing Animation Bubble */
            .mayer-typing-bubble {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: ${colors.primary};
                color: white;
                padding: 10px 18px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                box-shadow: 0 4px 15px rgba(201, 167, 108, 0.3);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            /* Typing bubble positioning based on container position */
            .position-bottom-right .mayer-typing-bubble,
            .position-top-right .mayer-typing-bubble {
                right: 80px;
            }

            .position-bottom-left .mayer-typing-bubble,
            .position-top-left .mayer-typing-bubble {
                left: 80px;
            }

            .mayer-typing-bubble.visible {
                opacity: 1;
            }

            /* Typing bubble arrow */
            .mayer-typing-bubble::after {
                content: '';
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 0;
                height: 0;
                border-top: 8px solid transparent;
                border-bottom: 8px solid transparent;
            }

            .position-bottom-right .mayer-typing-bubble::after,
            .position-top-right .mayer-typing-bubble::after {
                right: -8px;
                border-left: 8px solid ${colors.primary};
            }

            .position-bottom-left .mayer-typing-bubble::after,
            .position-top-left .mayer-typing-bubble::after {
                left: -8px;
                border-right: 8px solid ${colors.primary};
            }

            .mayer-typing-cursor {
                animation: mayer-blink 0.8s ease-in-out infinite;
            }

            /* Chat Window */
            .mayer-chat-window {
                position: absolute;
                width: 360px;
                height: 500px;
                background: ${colors.background};
                border-radius: 16px;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Chat window positioning based on container position */
            .position-bottom-right .mayer-chat-window {
                bottom: 80px;
                right: 0;
            }

            .position-bottom-left .mayer-chat-window {
                bottom: 80px;
                left: 0;
            }

            .position-top-right .mayer-chat-window {
                top: 80px;
                right: 0;
            }

            .position-top-left .mayer-chat-window {
                top: 80px;
                left: 0;
            }

            .mayer-chat-window.open {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: all;
            }

            /* Chat Header */
            .mayer-chat-header {
                background: ${colors.headerGradient};
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .mayer-chat-header-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .mayer-chat-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
            }

            .mayer-chat-avatar svg {
                width: 24px;
                height: 24px;
                fill: white;
            }

            .mayer-chat-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
            }

            .mayer-chat-title {
                color: white;
                font-size: 16px;
                font-weight: 600;
                margin: 0;
            }

            .mayer-chat-status {
                display: flex;
                align-items: center;
                gap: 6px;
                color: rgba(255, 255, 255, 0.9);
                font-size: 13px;
            }

            .mayer-status-dot {
                width: 8px;
                height: 8px;
                background: #4ade80;
                border-radius: 50%;
                animation: mayer-pulse 2s ease-in-out infinite;
            }

            .mayer-chat-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .mayer-chat-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .mayer-chat-close svg {
                width: 18px;
                height: 18px;
                stroke: white;
            }

            /* Messages Container */
            .mayer-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: linear-gradient(to bottom, #f8f5f0, #ffffff);
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .mayer-message {
                max-width: 85%;
                animation: mayer-message-in 0.3s ease;
            }

            .mayer-message.user {
                align-self: flex-end;
            }

            .mayer-message.bot {
                align-self: flex-start;
            }

            .mayer-message-bubble {
                padding: 12px 16px;
                border-radius: 16px;
                font-size: 14px;
                line-height: 1.5;
                white-space: pre-wrap;
            }

            .mayer-message.bot .mayer-message-bubble {
                background: ${colors.botBubble};
                color: ${colors.botText};
                border-bottom-left-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }

            .mayer-message.user .mayer-message-bubble {
                background: ${colors.userBubble};
                color: ${colors.userText};
                border-bottom-right-radius: 4px;
                box-shadow: 0 2px 8px rgba(201, 167, 108, 0.3);
            }

            .mayer-message-time {
                font-size: 11px;
                color: #999;
                margin-top: 4px;
            }

            .mayer-message.user .mayer-message-time {
                text-align: right;
            }

            /* Loading Indicator */
            .mayer-loading {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
                background: ${colors.botBubble};
                border-radius: 16px;
                border-bottom-left-radius: 4px;
                width: fit-content;
            }

            .mayer-loading-dot {
                width: 8px;
                height: 8px;
                background: ${colors.primary};
                border-radius: 50%;
                animation: mayer-loading 1.4s ease-in-out infinite;
            }

            .mayer-loading-dot:nth-child(2) {
                animation-delay: 0.2s;
            }

            .mayer-loading-dot:nth-child(3) {
                animation-delay: 0.4s;
            }

            /* Quick Actions */
            .mayer-quick-actions {
                padding: 12px 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                background: white;
                border-top: 1px solid #eee;
            }

            .mayer-quick-action {
                padding: 8px 14px;
                background: #f8f5f0;
                border: 1px solid #e8e0d5;
                border-radius: 20px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .mayer-quick-action:hover {
                background: ${colors.primary};
                color: white;
                border-color: ${colors.primary};
            }

            /* Input Area */
            .mayer-chat-input-area {
                padding: 16px 20px;
                background: white;
                border-top: 1px solid #eee;
            }

            .mayer-chat-input-container {
                display: flex;
                gap: 12px;
                align-items: flex-end;
            }

            .mayer-chat-input {
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #e0e0e0;
                border-radius: 24px;
                font-size: 14px;
                outline: none;
                transition: all 0.2s ease;
                resize: none;
                max-height: 100px;
                font-family: inherit;
            }

            .mayer-chat-input:focus {
                border-color: ${colors.primary};
                box-shadow: 0 0 0 3px rgba(201, 167, 108, 0.1);
            }

            .mayer-chat-input::placeholder {
                color: #aaa;
            }

            .mayer-chat-send {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: ${colors.headerGradient};
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .mayer-chat-send:hover:not(:disabled) {
                transform: scale(1.05);
                box-shadow: 0 4px 15px rgba(201, 167, 108, 0.4);
            }

            .mayer-chat-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .mayer-chat-send svg {
                width: 20px;
                height: 20px;
                fill: white;
            }

            /* Footer */
            .mayer-chat-footer {
                padding: 8px 20px;
                text-align: center;
                font-size: 11px;
                color: #999;
                background: white;
            }

            .mayer-chat-footer span {
                color: ${colors.primary};
                font-weight: 600;
            }

            /* Animations */
            @keyframes mayer-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }

            @keyframes mayer-shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            @keyframes mayer-blink {
                0%, 50%, 100% { opacity: 1; }
                25%, 75% { opacity: 0; }
            }

            @keyframes mayer-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.1); }
            }

            @keyframes mayer-loading {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }

            @keyframes mayer-message-in {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Mobile Responsive */
            @media (max-width: 480px) {
                .mayer-chat-window {
                    width: calc(100vw - 48px);
                    height: calc(100vh - 200px);
                    max-height: 500px;
                }

                .mayer-chat-container.position-bottom-right,
                .mayer-chat-container.position-bottom-left {
                    bottom: 16px;
                    right: 16px;
                    left: auto;
                }

                .mayer-typing-bubble {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createWidget() {
        // Container principal
        this.widgetContainer = document.createElement('div');
        this.widgetContainer.className = `mayer-chat-container position-${this.config.position}`;
        this.widgetContainer.innerHTML = `
            <!-- Chat Window -->
            <div class="mayer-chat-window">
                <div class="mayer-chat-header">
                    <div class="mayer-chat-header-info">
                        <div class="mayer-chat-avatar">
                            ${this.config.botIcon
                ? `<img src="${this.config.botIcon}" alt="Bot Avatar">`
                : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
            }
                        </div>
                        <div>
                            <h3 class="mayer-chat-title">${this.config.messages.headerTitle}</h3>
                            <div class="mayer-chat-status">
                                <div class="mayer-status-dot"></div>
                                <span>${this.config.messages.headerSubtitle}</span>
                            </div>
                        </div>
                    </div>
                    <button class="mayer-chat-close" title="Cerrar chat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                </div>
                <div class="mayer-chat-messages"></div>
                <div class="mayer-quick-actions">
                    ${this.config.callToActions.map(cta =>
                `<button class="mayer-quick-action" data-action="${cta.action}">${cta.text}</button>`
            ).join('')}
                </div>
                <div class="mayer-chat-input-area">
                    <div class="mayer-chat-input-container">
                        <input 
                            type="text" 
                            class="mayer-chat-input" 
                            placeholder="${this.config.messages.inputPlaceholder}"
                        >
                        <button class="mayer-chat-send" title="Enviar mensaje">
                            <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="mayer-chat-footer">
                    Powered by <span>${this.config.messages.poweredBy}</span>
                </div>
            </div>

            <!-- Chat Button -->
            <button class="mayer-chat-button" title="Abrir chat">
                ${this.config.botIcon
                ? `<img src="${this.config.botIcon}" alt="Chat">`
                : `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
            }
            </button>

            <!-- Typing Bubble -->
            <div class="mayer-typing-bubble">
                <span class="mayer-typing-text"></span><span class="mayer-typing-cursor">|</span>
            </div>
        `;

        document.body.appendChild(this.widgetContainer);

        // Referencias a elementos
        this.chatWindow = this.widgetContainer.querySelector('.mayer-chat-window');
        this.chatButton = this.widgetContainer.querySelector('.mayer-chat-button');
        this.messagesContainer = this.widgetContainer.querySelector('.mayer-chat-messages');
        this.inputField = this.widgetContainer.querySelector('.mayer-chat-input');
        this.sendButton = this.widgetContainer.querySelector('.mayer-chat-send');
        this.closeButton = this.widgetContainer.querySelector('.mayer-chat-close');
        this.typingBubble = this.widgetContainer.querySelector('.mayer-typing-bubble');
        this.typingTextEl = this.widgetContainer.querySelector('.mayer-typing-text');
        this.quickActions = this.widgetContainer.querySelectorAll('.mayer-quick-action');
    }

    attachEventListeners() {
        this.chatButton.addEventListener('click', () => this.toggleChat());
        this.closeButton.addEventListener('click', () => this.toggleChat());
        this.sendButton.addEventListener('click', () => this.sendMessage());

        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.quickActions.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action, btn.textContent);
            });
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatWindow.classList.toggle('open', this.isOpen);

        if (this.isOpen) {
            this.typingBubble.classList.remove('visible');
            this.stopTypingAnimation();
            this.inputField.focus();
        } else if (this.config.showTypingAnimation) {
            this.startTypingAnimation();
        }

        // Cambiar icono del botón
        this.chatButton.innerHTML = this.isOpen
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
            : (this.config.botIcon
                ? `<img src="${this.config.botIcon}" alt="Chat">`
                : `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
            );
    }

    startTypingAnimation() {
        const text = this.config.messages.typingIndicator;
        let index = 0;
        let isDeleting = false;
        let pauseTimeout = null;

        this.typingInterval = setInterval(() => {
            if (!isDeleting) {
                if (index < text.length) {
                    this.typingTextEl.textContent = text.slice(0, index + 1);
                    index++;
                    this.typingBubble.classList.add('visible');
                } else {
                    clearInterval(this.typingInterval);
                    pauseTimeout = setTimeout(() => {
                        isDeleting = true;
                        this.typingInterval = setInterval(() => {
                            if (index > 0) {
                                this.typingTextEl.textContent = text.slice(0, index - 1);
                                index--;
                            } else {
                                clearInterval(this.typingInterval);
                                this.typingBubble.classList.remove('visible');
                                setTimeout(() => {
                                    if (!this.isOpen) this.startTypingAnimation();
                                }, 2000);
                            }
                        }, 80);
                    }, 3000);
                }
            }
        }, 120);
    }

    stopTypingAnimation() {
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
            this.typingInterval = null;
        }
        this.typingTextEl.textContent = '';
    }

    addMessage(content, isUser = false) {
        const message = {
            id: Date.now(),
            content,
            isUser,
            timestamp: new Date()
        };
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `mayer-message ${message.isUser ? 'user' : 'bot'}`;
        messageEl.innerHTML = `
            <div class="mayer-message-bubble">${this.formatMessage(message.content)}</div>
            <div class="mayer-message-time">${this.formatTime(message.timestamp)}</div>
        `;
        this.messagesContainer.appendChild(messageEl);
    }

    formatMessage(text) {
        if (!text) return '';
        return text
            .replace(/\\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    showLoading() {
        this.isLoading = true;
        const loadingEl = document.createElement('div');
        loadingEl.className = 'mayer-loading';
        loadingEl.id = 'mayer-loading-indicator';
        loadingEl.innerHTML = `
            <div class="mayer-loading-dot"></div>
            <div class="mayer-loading-dot"></div>
            <div class="mayer-loading-dot"></div>
        `;
        this.messagesContainer.appendChild(loadingEl);
        this.scrollToBottom();
        this.sendButton.disabled = true;
    }

    hideLoading() {
        this.isLoading = false;
        const loadingEl = document.getElementById('mayer-loading-indicator');
        if (loadingEl) loadingEl.remove();
        this.sendButton.disabled = false;
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    async sendMessage() {
        const text = this.inputField.value.trim();
        if (!text || this.isLoading) return;

        // Agregar mensaje del usuario
        this.addMessage(text, true);
        this.inputField.value = '';

        // Mostrar indicador de carga
        this.showLoading();

        try {
            // Enviar al webhook
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: text,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString(),
                    source: 'mayer-fd-chatbot',
                    url: window.location.href
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.hideLoading();

                // Procesar respuesta del webhook
                const botResponse = data.output || data.response || data.message ||
                    'Gracias por tu mensaje. Un asesor se pondrá en contacto contigo pronto.';
                this.addMessage(botResponse, false);
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideLoading();
            this.addMessage(
                'Lo siento, hubo un problema al enviar tu mensaje. Por favor intenta de nuevo o contáctanos por WhatsApp.',
                false
            );
        }
    }

    async handleQuickAction(action, displayText) {
        // Mostrar el texto del CTA como mensaje del usuario
        this.addMessage(displayText, true);
        this.showLoading();

        try {
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: displayText,
                    action: action,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString(),
                    source: 'mayer-fd-chatbot',
                    url: window.location.href
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.hideLoading();
                const botResponse = data.output || data.response || data.message ||
                    this.getDefaultActionResponse(action);
                this.addMessage(botResponse, false);
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error handling action:', error);
            this.hideLoading();
            this.addMessage(this.getDefaultActionResponse(action), false);
        }
    }

    getDefaultActionResponse(action) {
        const responses = {
            'cotizacion': '¡Perfecto! Para brindarte una cotización personalizada necesito algunos datos:\n\n• Tipo de evento\n• Fecha aproximada\n• Número de invitados\n• Servicios que te interesan\n\n¿Me compartes estos datos?',
            'barra_libre': '🍸 **Nuestro servicio de Barra Libre incluye:**\n\n• Bartender profesional\n• Coctelería clásica y de autor\n• Cristalería y mobiliario\n• Bebidas alcohólicas y sin alcohol\n\n¿Te gustaría una cotización?',
            'mesa_dulces': '🍬 **Nuestras Mesas de Dulces son únicas:**\n\n• Diseños personalizados\n• Dulces artesanales premium\n• Decoración temática incluida\n• Montaje y desmontaje\n\n¿Para qué tipo de evento la necesitas?',
            'contactar': '📞 **Puedes contactarnos por:**\n\n• WhatsApp: 55 1484 6443\n• Teléfono: 6850 5314\n• Email: mayerfooddrink@gmail.com\n\nO bien, déjame tus datos y te contactamos nosotros.'
        };
        return responses[action] || 'Gracias por tu interés. ¿En qué más puedo ayudarte?';
    }

    // Método público para actualizar configuración
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Actualizar estilos dinámicamente si es necesario
        this.createStyles();
    }
}

// Inicializar el widget cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.mayerChat = new MayerChatWidget();
});
