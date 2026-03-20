class Logger {
    public info(...params: unknown[]) {
        console.info(new Date().toISOString(), 'INFO:', ...params);
    }

    public warn(...params: unknown[]) {
        console.warn(new Date().toISOString(), 'WARN:', ...params);
    }

    public error(...params: unknown[]) {
        console.error(new Date().toISOString(), 'ERROR:', ...params);
    }
}

export const logger = new Logger();