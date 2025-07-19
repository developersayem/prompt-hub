module.exports = {
  apps: [
    {
      name: 'prompt-server',
      script: './dist/index.js', // use your build entrypoint here (you mentioned index.js)
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
