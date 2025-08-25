# Color variables
CYAN=\033[1;36m
YELLOW=\033[1;33m
BLUE=\033[1;34m
MAGENTA=\033[1;35m
RED=\033[1;31m
GREEN=\033[1;32m
RESET=\033[0m

welcome-message:
	@echo "$(CYAN)🔥 WELCOME TO GUMBUS_SOUP TRANSCENDENCE! ✨$(RESET)"


## certificates
setup-certs:
	@if [ ! -f "backend/ssl/server.crt" ] || [ ! -f "backend/ssl/server.key" ]; then \
		echo "$(MAGENTA)Generating SSL certificates...$(RESET)"; \
		./backend/scripts/generate-ssl.sh; \
	fi

rm-certs:
	@rm -rf backend/ssl/server.*






up: check_env
	@echo "$(YELLOW)🚀 LET'S MAKE IT UP 🚀$(RESET)"
# npm run dev:both

check_env:
	@if [ ! -f ".env" ]; then \
		echo "$(RED) ERROR: .env doesn't exist$(RESET)"; \
		exit 1; \
	fi

clean: 

fclean: clean
	@echo "$(MAGENTA)Full clean-up...$(RESET)"

	@echo "$(GREEN)Full clean-up done.$(RESET)"

re: check_env
	@echo "$(MAGENTA)🔄 WELCOME BACK TO GUMBUS_SOUP TRANSCENDENCE! 🔄$(RESET)"
	@echo "$(YELLOW)⚡ LET'S RESTART AND MAKE IT UP AGAIN ⚡$(RESET)"
	npm install
	@if [ ! -f "backend/ssl/server.crt" ] || [ ! -f "backend/ssl/server.key" ]; then \
		echo "$(MAGENTA)Generating SSL certificates...$(RESET)"; \
		./backend/scripts/generate-ssl.sh; \
	fi
# npm run dev:both

.PHONY: re clean fclean up
