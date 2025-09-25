FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Set working directory
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose API port
EXPOSE 3000

# Run app
CMD ["node", "index.js"]
