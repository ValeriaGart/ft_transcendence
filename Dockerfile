FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# (Optional) Install any additional dependencies here
RUN apt-get update 
# && apt-get install -y <package-name>

# (Optional) Set working directory
WORKDIR /workspaces/ft_transcendence

# (Optional) Copy your project files
COPY . /workspaces/ft_transcendence

# (Optional) Install dependencies
RUN npm install

# (Optional) Expose ports if needed
# EXPOSE 3000

# (Optional) Set default command
CMD ["npm", "run", "dev:both"]