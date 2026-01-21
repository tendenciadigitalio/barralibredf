# Mayer F&D - Barra Libre Premium CDMX

## Estructura del Proyecto

```
/
├── server.js          # Servidor Node.js/Express
├── package.json       # Dependencias
├── admin/             # Panel de administración
├── data/              # Datos del CMS (content.json)
└── public/            # Frontend estático
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── js/            # Scripts adicionales
    └── images/        # Imágenes
```

## Despliegue en Dokploy

1. Tipo: **Nixpacks** (detecta automáticamente Node.js)
2. Branch: `main`
3. Puerto: `3003`

### Variables de Entorno Requeridas:

```
PORT=3003
JWT_SECRET=tu-secreto-seguro
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu-password-seguro
```

## Desarrollo Local

```bash
npm install
npm start
```

Sitio: http://localhost:3003
Admin: http://localhost:3003/admin
