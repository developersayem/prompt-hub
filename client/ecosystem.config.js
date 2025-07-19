module.exports = {
  apps: [
    {
      name: 'prompt-client',
      cwd: '/home/shopxetc/prompt-hub/client',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 30002
      }
    }
  ]
};
