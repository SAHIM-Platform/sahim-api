FROM node:18.17.0-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

COPY . .

EXPOSE 5050

RUN yarn prisma generate

RUN yarn build

RUN yarn pm2 set pm2:sysmonit false

CMD ["yarn", "prod:start:pm2"]
