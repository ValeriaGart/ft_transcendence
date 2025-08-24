up: check_env
	@echo "\033[1;36mWelcome to Gumbus_soup Transcendence!\033[0m"
	@echo "\033[1;33mLet's make it up\033[0m"
	@if [ ! -d "node_modules" ]; then \
		echo "\033[1;34mInstalling dependencies...\033[0m"; \
		npm install; \
	fi
	npm run dev:both

check_env:
	@if [ ! -f ".env" ]; then \
		./srcs/check_env.sh; \
	fi

down:
	@echo "\033[1;31mStopping the development server...\033[0m"
	@echo "\033[1;32mDevelopment server stopped.\033[0m"
	@echo "\033[1;36mGoodbye from the Gumbus_soup team! 👋\033[0m"
	@echo "\033[1;33mThanks for playing Transcendence! 🎮\033[0m"

clean:
	@echo "\033[1;31mStopping the development server...\033[0m"
	@echo "\033[1;34mCleaning up node_modules and package-lock.json...\033[0m"
	@rm -rf node_modules package-lock.json
	@echo "\033[1;32mClean-up done.\033[0m"

fclean: clean
	@echo "\033[1;35mFull clean-up...\033[0m"
	@rm -rf .vite
	@rm -rf dist
	@rm -rf build
	@echo "\033[1;32mFull clean-up done.\033[0m"

re: down check_env 
	@echo "\033[1;35mWelcome back to Gumbus_soup Transcendence!\033[0m"
	@echo "\033[1;33mLet's restart and make it up again\033[0m"
	npm install
	npm run dev:both

.PHONY: re clean fclean up down
