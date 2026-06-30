FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package*.json ./
RUN npm i --legacy-peer-deps

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/.medusa/server ./
RUN npm i --omit=dev --legacy-peer-deps
EXPOSE 9000
CMD ["npm", "run", "start"]
