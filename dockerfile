# Imagem leve com apt
FROM node:22-bookworm-slim

# Instala libs necessárias pro Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libdrm2 libexpat1 \
    libgbm1 libglib2.0-0 libgtk-3-0 libnss3 libnspr4 \
    libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
    libxrender1 libxss1 libxtst6 wget \
 && rm -rf /var/lib/apt/lists/*

# Não ignore o download do Chromium — deixe o Puppeteer/WPPConnect baixar o dele
# (Se um dia quiser usar o chromium do sistema, podemos ajustar)

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

ENV PORT=3000
CMD ["npm","start"]
