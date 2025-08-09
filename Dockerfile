FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

RUN apt-get update 

WORKDIR /workspaces/ft_transcendence

COPY . /workspaces/ft_transcendence

RUN npm install

CMD ["npm", "run", "dev:both"]