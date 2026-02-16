FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install all deps first
RUN npm install

COPY . .

RUN npm run build

# Railway expects the app to bind to this port dynamically
EXPOSE 3000

CMD ["node", "dist/main.js"]
