let appInstance = null;
export function setLoggerApp(app) {
	appInstance = app;
}

const colors = {
	info: '\x1b[32m',    // Green
	warn: '\x1b[33m',    // Yellow
	error: '\x1b[31m',   // Red
	debug: '\x1b[36m',   // Cyan
	default: '\x1b[0m'   // Reset
};
const reset = '\x1b[0m';


function log_dev(message, level) {
	switch (level) {
		case "debug":
			console.debug(`${colors.debug}[DEBUG]${reset} ${message}`);
			break ;
		case "info":
			console.log(`${colors.info}[INFO]${reset} ${message}`);
			break ;
		case "warn":
			console.warn(`${colors.warn}[WARN]${reset} ${message}`);
			break ;
		case "error":
			console.error(`${colors.error}[ERROR]${reset} ${message}`);
			break ;
		default:
			console.log(`[LOG] ${message}`);

	}
}

function log_prod(message, level) {
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


let log_it;
if (process.env.CONSOLE_LOG === "true") {
    log_it = log_dev;
} else {
    log_it = log_prod;
}

export default log_it;