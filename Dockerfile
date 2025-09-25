FROM ghcr.io/puppeteer/puppeteer:24.22.3

# Skip Chromium download (we'll use system Chrome)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies as root to avoid permissions issues
USER root
RUN npm install

# Change ownership of app folder to pptruser
RUN chown -R pptruser:pptruser /usr/src/app

# Switch back to Puppeteer non-root user
USER pptruser

# Copy the rest of the app code
COPY . .

# Start the app
CMD ["node", "index.js"]
