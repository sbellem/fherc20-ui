FROM node:18

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install --yes \
        iputils-ping \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@9.8.1
RUN npm install -g pnpm

WORKDIR /usr/src/fherc20

COPY . .

RUN pnpm install
RUN pnpm build:contracts
