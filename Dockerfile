FROM mcr.microsoft.com/playwright:focal

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# Expose port if needed
EXPOSE 3000

# Run the app
CMD ["node", "index.js"]
