/**
 * Iridescence Background Animation - WebGL Shader
 * Inspired by Aura.build - Adapted for Mayer F&D
 * Colors: Pink/Magenta (#cc2d69)
 */

class IridescenceAnimation {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            console.warn('IridescenceAnimation: container not found');
            return;
        }

        // Configuration with pink/magenta colors
        this.config = {
            color: options.color || [0.8, 0.18, 0.41], // #cc2d69 in normalized RGB
            speed: options.speed || 0.6,
            amplitude: options.amplitude || 0.15,
            mouseReactive: options.mouseReactive !== false,
            ...options
        };

        this.mouse = { x: 0.5, y: 0.5 };
        this.targetMouse = { x: 0.5, y: 0.5 };
        this.time = 0;
        this.animationId = null;

        this.init();
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        this.container.appendChild(this.canvas);

        // Get WebGL context
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');

        if (!this.gl) {
            console.warn('WebGL not supported, falling back to CSS animation');
            this.fallbackCSS();
            return;
        }

        this.createShaders();
        this.createBuffers();
        this.resize();
        this.bindEvents();
        this.animate();
    }

    // Vertex Shader
    get vertexShaderSource() {
        return `
            attribute vec2 aPosition;
            varying vec2 vUv;
            
            void main() {
                vUv = aPosition * 0.5 + 0.5;
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;
    }

    // Fragment Shader - The magic happens here
    get fragmentShaderSource() {
        return `
            precision highp float;
            
            uniform float uTime;
            uniform vec3 uColor;
            uniform vec2 uResolution;
            uniform vec2 uMouse;
            uniform float uAmplitude;
            uniform float uSpeed;
            
            varying vec2 vUv;
            
            void main() {
                float mr = min(uResolution.x, uResolution.y);
                vec2 uv = (vUv * 2.0 - 1.0) * uResolution.xy / mr;
                
                // Mouse interaction
                uv += (uMouse - vec2(0.5)) * uAmplitude;
                
                // Plasma flow algorithm
                float d = -uTime * 0.5 * uSpeed;
                float a = 0.0;
                
                for (float i = 0.0; i < 8.0; ++i) {
                    a += cos(i - d - a * uv.x);
                    d += sin(uv.y * i + a);
                }
                
                d += uTime * 0.5 * uSpeed;
                
                // Color calculation with flowing effect
                vec3 col = vec3(
                    cos(uv.x * d) * 0.6 + 0.4,
                    cos(uv.y * a) * 0.6 + 0.4,
                    cos(a + d) * 0.5 + 0.5
                );
                
                // Apply base color with smooth blending
                col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5);
                col = mix(col * 0.3, col * uColor, 0.8);
                
                // Add subtle glow effect
                float glow = 0.02 / length(uv * 0.5);
                col += uColor * glow * 0.3;
                
                // Vignette effect
                float vignette = 1.0 - length(vUv - 0.5) * 0.8;
                col *= vignette;
                
                gl_FragColor = vec4(col, 1.0);
            }
        `;
    }

    createShaders() {
        const gl = this.gl;

        // Compile vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.vertexShaderSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
            return;
        }

        // Compile fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, this.fragmentShaderSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
            return;
        }

        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }

        gl.useProgram(this.program);

        // Get uniform locations
        this.uniforms = {
            uTime: gl.getUniformLocation(this.program, 'uTime'),
            uColor: gl.getUniformLocation(this.program, 'uColor'),
            uResolution: gl.getUniformLocation(this.program, 'uResolution'),
            uMouse: gl.getUniformLocation(this.program, 'uMouse'),
            uAmplitude: gl.getUniformLocation(this.program, 'uAmplitude'),
            uSpeed: gl.getUniformLocation(this.program, 'uSpeed')
        };

        // Set static uniforms
        gl.uniform3fv(this.uniforms.uColor, this.config.color);
        gl.uniform1f(this.uniforms.uAmplitude, this.config.amplitude);
        gl.uniform1f(this.uniforms.uSpeed, this.config.speed);
    }

    createBuffers() {
        const gl = this.gl;

        // Fullscreen quad
        const vertices = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(this.program, 'aPosition');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio, 2);

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.uniforms.uResolution, this.canvas.width, this.canvas.height);
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        if (this.config.mouseReactive) {
            document.addEventListener('mousemove', (e) => {
                this.targetMouse.x = e.clientX / window.innerWidth;
                this.targetMouse.y = 1 - (e.clientY / window.innerHeight);
            });
        }
    }

    animate() {
        const gl = this.gl;

        // Smooth mouse interpolation
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Update uniforms
        this.time += 0.016; // ~60fps
        gl.uniform1f(this.uniforms.uTime, this.time);
        gl.uniform2f(this.uniforms.uMouse, this.mouse.x, this.mouse.y);

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // CSS fallback for browsers without WebGL
    fallbackCSS() {
        this.canvas.remove();

        const fallback = document.createElement('div');
        fallback.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                135deg,
                rgba(204, 45, 105, 0.3) 0%,
                rgba(233, 77, 137, 0.2) 25%,
                rgba(168, 31, 83, 0.3) 50%,
                rgba(255, 107, 157, 0.2) 75%,
                rgba(204, 45, 105, 0.3) 100%
            );
            background-size: 400% 400%;
            animation: iridescenceFallback 15s ease infinite;
        `;

        // Add keyframes
        if (!document.getElementById('iridescence-fallback-styles')) {
            const style = document.createElement('style');
            style.id = 'iridescence-fallback-styles';
            style.textContent = `
                @keyframes iridescenceFallback {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `;
            document.head.appendChild(style);
        }

        this.container.appendChild(fallback);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas) {
            this.canvas.remove();
        }
    }

    // Update color dynamically
    setColor(r, g, b) {
        this.config.color = [r, g, b];
        if (this.gl && this.uniforms) {
            this.gl.uniform3fv(this.uniforms.uColor, this.config.color);
        }
    }
}

// Auto-initialize on elements with data-iridescence attribute
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-iridescence]').forEach(container => {
        new IridescenceAnimation(container);
    });
});

// Export for manual use
window.IridescenceAnimation = IridescenceAnimation;
