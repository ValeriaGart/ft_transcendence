# Color variables
CYAN=\033[1;36m
YELLOW=\033[1;33m
BLUE=\033[1;34m
MAGENTA=\033[1;35m
RED=\033[1;31m
GREEN=\033[1;32m
RESET=\033[0m

all: welcome-message start-up-elk start-up-app invite-message

welcome-message:
	@echo "$(CYAN)🔥 WELCOME TO GUMBUS_SOUP TRANSCENDENCE! ✨$(RESET)"

invite-message:
	@IP=$$(ip -4 addr show scope global | grep inet | awk '{print $$2}' | cut -d/ -f1 | head -n1); \
	echo "🌐 Share this link with your friends: http://$${IP}:5173"

# ## START UP commands

start-up-elk:
	@echo "$(CYAN)📋 LET'S MAKE ELK UP 📈$(RESET)"
	$(MAKE) -f Makefile.elk config-devops
	$(MAKE) -f Makefile.elk setup-log-dir
	$(MAKE) -f Makefile.elk elk-up
	$(MAKE) -f Makefile.elk set-lifecycle

start-up-app: setup-db check_env setup-certs invite-message
	@echo "$(CYAN)🚀 LET'S MAKE APP UP 🚀$(RESET)"
	@echo "start up app"
	@docker compose up app --build -d > docker_build.log 2>&1

restart-app:
	@docker compose down app && docker compose up app -d


# ## down commands
down-elk:
	@(MAKE) -f Makefile.elk elk-down

down-app:
	@docker compose down app

down:
	@docker compose down

# show logs
logs-app:
	@echo "Showing app logs (Ctrl+C to stop):"
	docker compose logs -f app

# ## setup for app
setup-db:
	@echo "$(YELLOW)🏗 setup-db$(RESET)"
	@touch db.sqlite

rm-db: 
	@echo "$(GREEN)🧼 remove database"
	@rm db.sqlite

check_env:
	@if [ ! -f ".env" ]; then \
		echo "$(RED) ERROR: .env doesn't exist$(RESET)"; \
		exit 1; \
	fi


## certificates
setup-certs:
	@echo "$(YELLOW)🏗 setup certificates$(RESET)"
	@if [ ! -f "backend/ssl/server.crt" ] || [ ! -f "backend/ssl/server.key" ]; then \
		echo "$(YELLOW)Generating SSL certificates...$(RESET)"; \
		./backend/scripts/generate-ssl.sh; \
	fi

rm-certs:
	@echo "$(GREEN)🧼 remove certs$(RESET)"
	@rm -rf backend/ssl/server.*



clean: rm-certs rm-db
	@rm docker_build.log
	@docker compose down

fclean: clean
	@echo "$(GREEN)Full clean-up...$(RESET)"
	@docker compose down -v
	@echo "$(GREEN)Full clean-up done.$(RESET)"

# npm run dev:both

.PHONY: re clean fclean up
