module.exports = {
  apps: [
    {
      name: "prompt-hub-backend",
      script: "./dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
