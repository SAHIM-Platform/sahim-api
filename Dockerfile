FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

EXPOSE 5000

RUN pnpm prisma generate

RUN pnpm build

RUN pnpm pm2 set pm2:sysmonit false

CMD ["pnpm", "prod:start:pm2"]
