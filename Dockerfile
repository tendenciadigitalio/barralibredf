FROM node:18-alpine

WORKDIR /app

# Copiar archivos del backend
COPY prototype-2/backend/package*.json ./

RUN npm install --production

# Copiar todo el backend
COPY prototype-2/backend/ ./

# Copiar el frontend estático
COPY prototype-2/*.html ./public/
COPY prototype-2/*.css ./public/
COPY prototype-2/*.js ./public/
COPY prototype-2/js/ ./public/js/
COPY prototype-2/images/ ./public/images/

# Exponer puerto
EXPOSE 3003

# Comando de inicio
CMD ["node", "server.js"]
