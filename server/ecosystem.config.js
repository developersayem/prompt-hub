module.exports = {
  apps: [
    {
      name: 'prompt-hub-server',
      script: './dist/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4000 // or whatever you use
      }
    }
  ]
};
