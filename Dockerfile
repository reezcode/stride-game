# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for layer-cached dependency install
COPY package.json package-lock.json ./

RUN npm ci

# Copy source and build
COPY . .

RUN npm run build

# ─── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built SPA
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config (SPA fallback for vue-router history mode)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
