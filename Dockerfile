FROM node:20-alpine

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.11.1 --activate

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install

COPY . .

# Ensure admin dashboard files are in public/admin inside image
RUN mkdir -p ./public && \
    if [ -d ".medusa/server/public" ]; then cp -r .medusa/server/public/* ./public/; fi

RUN chmod +x ./seed.sh 2>/dev/null || true

EXPOSE 9000

CMD ["sh", "-c", "until nc -z -w 2 ${DATABASE_HOST:-medusa-postgres} ${DATABASE_PORT:-5432}; do sleep 1; done && pnpm exec medusa db:migrate && (pnpm exec medusa user -e admin@test.com -p supersecret || true) && exec pnpm exec medusa start -H 0.0.0.0 -p 9000"]
