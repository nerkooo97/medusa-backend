FROM node:20-alpine

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.11.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install

COPY . .

RUN chmod +x ./start.sh ./seed.sh 2>/dev/null || true

EXPOSE 9000

ENTRYPOINT ["./start.sh"]
