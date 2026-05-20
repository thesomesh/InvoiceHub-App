FROM node:20-slim

WORKDIR /app

# Install lightweight chromium
RUN apt-get update && apt-get install -y \
      chromium-headless-shell \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-headless-shell

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .
EXPOSE 5219

CMD ["npm", "start"]