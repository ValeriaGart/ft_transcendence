FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

RUN apt-get update && apt-get install logrotate cron -y

WORKDIR /workspaces/ft_transcendence

COPY . /workspaces/ft_transcendence

RUN npm install

ENTRYPOINT ["sh", "./entrypoint.sh"]

CMD ["npm", "run", "dev:both"]