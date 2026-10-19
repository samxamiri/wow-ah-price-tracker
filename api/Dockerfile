# --- Stage 1: compile TypeScript to JavaScript ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# --- Stage 2: small runtime image with only production dependencies ---
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY sql ./sql

# The official Node image ships with a non-root "node" user.
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
