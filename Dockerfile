FROM ghcr.io/puppeteer/puppeteer:24.22.3

# Avoid downloading Chromium again since the image already has it
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Switch to root to allow npm to write package-lock.json
USER root
RUN npm install
# Switch back to Puppeteer user for security
USER pptruser

# Copy the rest of the application code
COPY . .

# Start the application
CMD ["node", "index.js"]
