module.exports = {
  apps: [{
    name: 'webrtc-server',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    max_memory_restart: '1G',
    restart_delay: 3000,
    exp_backoff_restart_delay: 100,
    max_restarts: 5,
    kill_timeout: 3000,
    wait_ready: true,
    listen_timeout: 5000
  }]
}