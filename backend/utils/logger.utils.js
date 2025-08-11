


let appInstance = null;
let log_it;
log_it = log_dev;

const colors = {
	info: '\x1b[32m',    // Green
	warn: '\x1b[33m',    // Yellow
	error: '\x1b[31m',   // Red
	debug: '\x1b[36m',   // Cyan
	default: '\x1b[0m'   // Reset
};
const reset = '\x1b[0m';


function log_dev(message, level = "info") {
	switch (level) {
		case "debug":
			console.debug(`${colors.debug}[DEBUG]${reset} ${message}`);
			appInstance.log.debug(message);
			break ;
		case "info":
			console.log(`${colors.info}[INFO]${reset} ${message}`);
			appInstance.log.info(message);
			break ;
		case "warn":
			console.warn(`${colors.warn}[WARN]${reset} ${message}`);
			appInstance.log.warn(message);
			break ;
		case "error":
			console.error(`${colors.error}[ERROR]${reset} ${message}`);
			appInstance.log.error(message);
			break ;
		default:
			console.log(`[LOG] ${message}`);
			appInstance.log.info(message);
	}
}

function log_prod(message, level = "info") {
	switch (level) {
		case "debug":
			appInstance.log.debug(message);
			break ;
		case "info":
			appInstance.log.info(message);
			break ;
		case "warn":
			appInstance.log.warn(message);
			break ;
		case "error":
			appInstance.log.error(message);
			break ;

		default:
			appInstance.log.info(message);
	}
}

export function setLoggerApp(app, console) {
	appInstance = app;
	if (console === "true") {
		log_it = log_dev;
		return ;
	} 
	else if (console === "false") {
		log_it = log_prod;
		return ;
	}
}

export function log(message, level = "info") {
    return log_it(message, level);
}
