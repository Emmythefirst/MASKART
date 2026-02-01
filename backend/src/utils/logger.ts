import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

// Log colors for console
const colors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m',
};

class Logger {
  private logDir: string;
  private isDevelopment: boolean;

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  /**
   * Write to log file
   */
  private writeToFile(_level: LogLevel, message: string): void {
    if (this.isDevelopment) return; // Skip file logging in development

    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `${date}.log`;
      const filepath = path.join(this.logDir, filename);
      
      fs.appendFileSync(filepath, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Write to console
   */
  private writeToConsole(level: LogLevel, message: string): void {
    const color = colors[level];
    console.log(`${color}${message}${colors.RESET}`);
  }

  /**
   * Main log method
   */
  private log(level: LogLevel, message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    this.writeToConsole(level, formattedMessage);
    this.writeToFile(level, formattedMessage);
  }

  /**
   * Log error
   */
  error(message: string, error?: Error | any): void {
    const meta = error ? {
      message: error.message,
      stack: error.stack,
      ...error
    } : undefined;
    
    this.log(LogLevel.ERROR, message, meta);
  }

  /**
   * Log warning
   */
  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  /**
   * Log info
   */
  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  /**
   * Log debug (only in development)
   */
  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, meta);
    }
  }

  /**
   * Log HTTP request
   */
  request(method: string, path: string, statusCode: number, duration: number): void {
    const message = `${method} ${path} ${statusCode} - ${duration}ms`;
    
    if (statusCode >= 500) {
      this.error(message);
    } else if (statusCode >= 400) {
      this.warn(message);
    } else {
      this.info(message);
    }
  }

  /**
   * Log database query
   */
  query(query: string, duration: number): void {
    this.debug(`Query executed in ${duration}ms`, { query });
  }
}

// Export singleton instance
export const logger = new Logger();

export default logger;