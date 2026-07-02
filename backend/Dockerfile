FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

FROM base AS build
COPY . .
RUN npm ci --legacy-peer-deps
RUN npm run build --workspace=apps/backend

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/apps/backend/.medusa/server ./
RUN npm i --omit=dev --legacy-peer-deps
EXPOSE 9000
CMD ["npm", "run", "start"]
