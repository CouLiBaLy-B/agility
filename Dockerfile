FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY server ./server
COPY src ./src
EXPOSE 3000
CMD ["sh", "-c", "npm run db:generate && npm run db:deploy && npm run start:api"]
