# Mayer F&D - CMS Website

Sistema de gestión de contenido para el sitio web de Mayer Food & Drink.

## 🚀 Configuración en Dokploy (IMPORTANTE)

### Volúmenes Persistentes

Para que las imágenes y el contenido NO se borren al redesplegar, debes configurar **volúmenes** en Dokploy:

1. Ve a tu aplicación en Dokploy
2. Busca la sección **"Volumes"** o **"Persistent Storage"**
3. Añade estos dos volúmenes:

| Mount Path | Volume Name | Descripción |
|------------|-------------|-------------|
| `/app/data` | `mayer-data` | Guarda el content.json |
| `/app/public/images` | `mayer-images` | Guarda todas las imágenes subidas |

### Configuración en Docker Compose (Dokploy)

Si Dokploy te permite usar docker-compose, ya está incluido el archivo `docker-compose.yml` con los volúmenes configurados.

### Configuración Manual de Volúmenes

Si necesitas configurar manualmente en Dokploy, busca la opción de **"Advanced" → "Volumes"** y añade:

```
/app/data → mayer-data (Persistent)
/app/public/images → mayer-images (Persistent)
```

## 📁 Estructura del Proyecto

```
├── admin/              # Panel de administración
│   ├── index.html      # UI del admin
│   └── admin.js        # Lógica del admin
├── public/             # Archivos públicos
│   ├── index.html      # Sitio web principal
│   ├── styles.css      # Estilos
│   ├── script.js       # JavaScript principal
│   ├── js/             # Scripts adicionales
│   └── images/         # 📌 VOLUMEN PERSISTENTE
├── data/               # 📌 VOLUMEN PERSISTENTE
│   └── content.json    # Contenido del CMS
├── server.js           # Servidor Express
├── Dockerfile          # Configuración Docker
└── docker-compose.yml  # Docker Compose con volúmenes
```

## 🔧 Desarrollo Local

```bash
npm install
npm start
```

Servidor disponible en: http://localhost:3000
Panel admin: http://localhost:3000/admin

## 🌐 URLs en Producción

- **Sitio público**: https://tu-dominio.com
- **Panel admin**: https://tu-dominio.com/admin

## ⚠️ Solución de Problemas

### Las imágenes se borran al redesplegar
→ Verifica que los volúmenes estén configurados correctamente en Dokploy

### El contenido no se guarda
→ Asegúrate de que el volumen `/app/data` esté montado

### Error de permisos
→ Los volúmenes necesitan permisos de escritura

## 📞 Contacto

Mayer Food & Drink
- Tel: 55 1484 6443
- Email: mayerfooddrink@gmail.com
