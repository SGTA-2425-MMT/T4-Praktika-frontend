
# Stage 1: Build the Angular app
FROM node:current-alpine AS build
WORKDIR /app

# Mount a cache for pnpm's store
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*
# Copy built app to Nginx html directory
COPY --from=build /app/dist/t4-praktika-frontend/browser /usr/share/nginx/html
# Copy custom nginx config if needed (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
