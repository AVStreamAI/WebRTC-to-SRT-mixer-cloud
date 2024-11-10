import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';
import https from 'https';
import fs from 'fs';
import { StreamProcessor } from './src/utils/streamProcessor.js';
import { logger } from './src/utils/logger.js';

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://avstream.tech'] // Change to your domain
    : ['http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));

let server;

if (process.env.NODE_ENV === 'production') {
  const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/avstream.tech/privkey.pem'), // Change according your path 
    cert: fs.readFileSync('/etc/letsencrypt/live/avstream.tech/fullchain.pem') // Change according your path
  };
  server = https.createServer(sslOptions, app);
} else {
  server = http.createServer(app);
}

const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  perMessageDeflate: false,
  clientTracking: true
});

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  logger.debug(`New WebSocket connection from ${ip}`);
  
  const processor = new StreamProcessor();

  ws.on('message', (data) => {
    try {
      if (data instanceof Buffer && data[0] === 123) {
        const message = JSON.parse(data.toString());
        logger.debug('Control message:', message);

        if (message.action === 'start') {
          const success = processor.start(message.destination);
          ws.send(JSON.stringify({ 
            type: success ? 'started' : 'error',
            message: success ? 'Streaming started' : 'Failed to start streaming'
          }));
        } else if (message.action === 'stop') {
          processor.stop();
          ws.send(JSON.stringify({ type: 'stopped' }));
        }
      } else {
        processor.processChunk(data);
      }
    } catch (error) {
      logger.error('Error processing message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  });

  ws.on('close', () => {
    logger.debug('Client disconnected');
    processor.stop();
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
    processor.stop();
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.debug(`Server running on port ${PORT}`);
});