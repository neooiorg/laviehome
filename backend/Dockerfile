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
CMD ["/bin/sh", "-c", "mkdir -p .medusa/server/public/admin && export DATABASE_URL=$(echo ${DATABASE_URL} | sed 's/&channel_binding=require//') && npm run start 2>&1 || (echo '=== STARTUP FAILED ===' && sleep 600)"]
