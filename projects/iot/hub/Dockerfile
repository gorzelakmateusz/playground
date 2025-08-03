# Use Node.js image with pre-installed build tools
FROM node:22-alpine

# Install everything needed for native modules
RUN apk add --no-cache \
    build-base \
    python3 \
    make \
    g++ \
    git

# Install node-gyp globally
RUN npm install -g node-gyp

WORKDIR /app

# Copy project files
COPY . .

# Remove node_modules if they exist
RUN rm -rf node_modules package-lock.json

# Install everything with npm (no pnpm)
RUN npm install

# Build the project
RUN npm run build

# Create data folder
RUN mkdir -p /app/data

# Run the application
EXPOSE 3000
CMD ["node", "dist/app.js"]