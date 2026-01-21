import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

// Paths
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const DATA_DIR = path.join(__dirname, 'data');

// Valid image categories (subdirectories in public/images/)
const IMAGE_CATEGORIES = ['hero', 'about', 'services', 'catering', 'events', 'dulces', 'cocteleria', 'gallery', 'contact'];

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory
app.use('/public', express.static(PUBLIC_DIR));
app.use('/images', express.static(IMAGES_DIR));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve frontend static files (CSS, JS)
app.use('/js', express.static(path.join(PUBLIC_DIR, 'js')));
app.use(express.static(PUBLIC_DIR));

// Serve frontend index.html at root
app.get('/', (req, res) => {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('Mayer F&D - Backend API');
    }
});

// Ensure directories exist
const ensureDirs = () => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    IMAGE_CATEGORIES.forEach(category => {
        const categoryDir = path.join(IMAGES_DIR, category);
        if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir, { recursive: true });
    });
};
ensureDirs();

// Multer configuration for file uploads with category support
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.params.category || req.body.category || 'gallery';
        const validCategory = IMAGE_CATEGORIES.includes(category) ? category : 'gallery';
        const uploadPath = path.join(IMAGES_DIR, validCategory);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp, svg)'));
        }
    }
});

// Content file path
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

// Helper functions
const readContent = () => {
    try {
        return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
    } catch (error) {
        console.error('Error reading content:', error);
        return {};
    }
};

const writeContent = (content) => {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
};

// Create hashed password for admin (done once at startup)
let adminPasswordHash = '';
(async () => {
    adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
})();

// ========== AUTH MIDDLEWARE ==========
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        req.user = user;
        next();
    });
};

// ========== AUTH ROUTES ==========
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    if (username !== adminUsername) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, adminPasswordHash);
    if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
        { username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        message: 'Login exitoso',
        token,
        user: { username, role: 'admin' }
    });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// ========== CONTENT ROUTES ==========
// Get all content (public)
app.get('/api/content', (req, res) => {
    const content = readContent();
    res.json(content);
});

// Get specific section (public)
app.get('/api/content/:section', (req, res) => {
    const content = readContent();
    const section = content[req.params.section];

    if (!section) {
        return res.status(404).json({ error: 'Sección no encontrada' });
    }

    res.json(section);
});

// Update entire section (protected)
app.put('/api/content/:section', authenticateToken, (req, res) => {
    const content = readContent();
    const sectionName = req.params.section;

    if (!content[sectionName]) {
        return res.status(404).json({ error: 'Sección no encontrada' });
    }

    content[sectionName] = { ...content[sectionName], ...req.body };
    writeContent(content);

    res.json({
        message: `Sección "${sectionName}" actualizada correctamente`,
        data: content[sectionName]
    });
});

// Update specific field in section (protected)
app.patch('/api/content/:section', authenticateToken, (req, res) => {
    const content = readContent();
    const sectionName = req.params.section;

    if (!content[sectionName]) {
        return res.status(404).json({ error: 'Sección no encontrada' });
    }

    // Deep merge the updates
    const deepMerge = (target, source) => {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], deepMerge(target[key], source[key]));
            }
        }
        return { ...target, ...source };
    };

    content[sectionName] = deepMerge(content[sectionName], req.body);
    writeContent(content);

    res.json({
        message: `Sección "${sectionName}" actualizada correctamente`,
        data: content[sectionName]
    });
});

// ========== IMAGE UPLOAD ROUTES ==========

// Upload image to specific category via form data
app.post('/api/upload/:category', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }

    const category = req.params.category;
    const imageUrl = `/images/${category}/${req.file.filename}`;

    res.json({
        message: 'Imagen subida correctamente',
        url: imageUrl,
        filename: req.file.filename,
        category: category,
        fullUrl: `http://localhost:${PORT}${imageUrl}`
    });
});

// Upload image via base64 (for drag and drop)
app.post('/api/upload-base64/:category', authenticateToken, async (req, res) => {
    try {
        const { imageData, filename: originalFilename } = req.body;
        const category = req.params.category;

        if (!imageData) {
            return res.status(400).json({ error: 'No se proporcionó imagen' });
        }

        // Validate category
        const validCategory = IMAGE_CATEGORIES.includes(category) ? category : 'gallery';

        // Extract base64 data
        const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: 'Formato de imagen inválido' });
        }

        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const uniqueName = `${Date.now()}-${uuidv4().slice(0, 8)}.${ext}`;
        const uploadPath = path.join(IMAGES_DIR, validCategory, uniqueName);

        // Write file
        fs.writeFileSync(uploadPath, buffer);

        const imageUrl = `/images/${validCategory}/${uniqueName}`;

        res.json({
            success: true,
            message: 'Imagen subida correctamente',
            url: imageUrl,
            filename: uniqueName,
            category: validCategory,
            fullUrl: `http://localhost:${PORT}${imageUrl}`
        });
    } catch (error) {
        console.error('Error uploading base64 image:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});

// List images in a category
app.get('/api/images/:category', authenticateToken, (req, res) => {
    const category = req.params.category;

    if (!IMAGE_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Categoría inválida' });
    }

    const categoryDir = path.join(IMAGES_DIR, category);

    try {
        const files = fs.readdirSync(categoryDir);
        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
            .map(file => ({
                filename: file,
                url: `/images/${category}/${file}`,
                fullUrl: `http://localhost:${PORT}/images/${category}/${file}`,
                category: category
            }));
        res.json(images);
    } catch (error) {
        res.json([]);
    }
});

// List all images across all categories
app.get('/api/images', authenticateToken, (req, res) => {
    const allImages = [];

    IMAGE_CATEGORIES.forEach(category => {
        const categoryDir = path.join(IMAGES_DIR, category);
        try {
            const files = fs.readdirSync(categoryDir);
            files
                .filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
                .forEach(file => {
                    allImages.push({
                        filename: file,
                        url: `/images/${category}/${file}`,
                        fullUrl: `http://localhost:${PORT}/images/${category}/${file}`,
                        category: category
                    });
                });
        } catch (error) {
            // Directory might not exist or be empty
        }
    });

    res.json(allImages);
});

// Delete image
app.delete('/api/images/:category/:filename', authenticateToken, (req, res) => {
    const { category, filename } = req.params;

    if (!IMAGE_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Categoría inválida' });
    }

    const filePath = path.join(IMAGES_DIR, category, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'Imagen eliminada correctamente' });
});

// Get available categories
app.get('/api/categories', (req, res) => {
    res.json(IMAGE_CATEGORIES);
});

// ========== ADMIN PANEL ROUTE ==========
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MAYER F&D - CMS Backend                   ║
╠══════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                    ║
║  Admin Panel:       http://localhost:${PORT}/admin              ║
║                                                              ║
║  Image Categories:                                           ║
║    ${IMAGE_CATEGORIES.join(', ')}
║                                                              ║
║  Default Credentials:                                        ║
║    Username: ${process.env.ADMIN_USERNAME || 'admin'}                                        ║
║    Password: (see .env file)                                 ║
╚══════════════════════════════════════════════════════════════╝
    `);
});
