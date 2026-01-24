# Dockerfile para Mayer F&D CMS
FROM node:18-alpine

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install --production

# Copiar código fuente
COPY . .

# Crear directorios para datos persistentes (serán montados como volúmenes)
RUN mkdir -p /app/data /app/public/images

# El puerto que usa el servidor
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production

# Comando de inicio
CMD ["node", "server.js"]
