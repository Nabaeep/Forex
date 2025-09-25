FROM ghcr.io/puppeteer/puppeteer:24.22.3
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

    WORKDIR /usr/src/app

    COPY package*.json ./

    RUN npm install

    COPY . .

    CMD ["node", "index.js"]