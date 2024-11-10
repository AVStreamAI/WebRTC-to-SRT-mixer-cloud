import { createServer } from 'net';
import { logger } from './logger.js';

export async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    try {
      const isAvailable = await checkPort(port);
      if (isAvailable) {
        logger.debug(`Found available port: ${port}`);
        return port;
      }
    } catch (error) {
      logger.error(`Error checking port ${port}:`, error);
    }
  }
  
  throw new Error(`No available ports found after ${maxAttempts} attempts starting from ${startPort}`);
}

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
      .listen(port)
      .once('listening', () => {
        server.close();
        resolve(true);
      })
      .once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          logger.debug(`Port ${port} is in use`);
          resolve(false);
        } else {
          logger.error(`Error checking port ${port}:`, err);
          resolve(false);
        }
      });
  });
}