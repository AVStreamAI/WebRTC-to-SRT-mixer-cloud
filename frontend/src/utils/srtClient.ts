import { logger } from './logger';

export class SRTClient {
  private mediaRecorder: MediaRecorder | null = null;
  private ws: WebSocket | null = null;
  private isStreaming: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 3;

  private getWebSocketUrl(): string {
    const isProduction = window.location.protocol === 'https:';
    const protocol = isProduction ? 'wss:' : 'ws:';
    const host = isProduction ? window.location.host : 'localhost:8080';
    return `${protocol}//${host}/ws`;
  }

  async startStreaming(stream: MediaStream, destination: string) {
    try {
      if (this.isStreaming) {
        await this.stopStreaming();
      }

      const wsUrl = this.getWebSocketUrl();
      logger.debug(`Connecting to WebSocket at ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      await new Promise<void>((resolve, reject) => {
        if (!this.ws) return reject(new Error('No WebSocket instance'));

        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          logger.debug('WebSocket connected');
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          logger.error('WebSocket error:', error);
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = () => {
          logger.debug('WebSocket connection closed');
          if (this.isStreaming && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            logger.debug(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.startStreaming(stream, destination), 1000 * this.reconnectAttempts);
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            logger.debug('Received message:', message);
            
            if (message.type === 'error') {
              logger.error('Server error:', message.message);
            }
          } catch (error) {
            logger.error('Error parsing message:', error);
          }
        };
      });

      const mimeType = 'video/webm;codecs=h264,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Unsupported MIME type for MediaRecorder');
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
          const buffer = await event.data.arrayBuffer();
          this.ws.send(buffer);
        }
      };

      // Send configuration before starting the recorder
      this.ws.send(JSON.stringify({
        action: 'start',
        destination,
        config: {
          hasAudio: stream.getAudioTracks().length > 0,
          hasVideo: stream.getVideoTracks().length > 0
        }
      }));

      this.mediaRecorder.start(40); // ~25fps
      this.isStreaming = true;
      this.reconnectAttempts = 0;

    } catch (error) {
      logger.error('Failed to start streaming:', error);
      this.stopStreaming();
      throw error;
    }
  }

  async stopStreaming() {
    try {
      this.isStreaming = false;

      if (this.mediaRecorder?.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'stop' }));
        await new Promise(resolve => setTimeout(resolve, 100)); // Give time for the message to be sent
        this.ws.close();
      }
    } catch (error) {
      logger.error('Error stopping stream:', error);
    } finally {
      this.mediaRecorder = null;
      this.ws = null;
      this.reconnectAttempts = 0;
    }
  }

  isActive(): boolean {
    return this.isStreaming;
  }
}