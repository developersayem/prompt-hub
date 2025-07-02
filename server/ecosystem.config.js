module.exports = {
  apps: [
    {
      name: "backend",
      script: "./dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: "5001", // or another allowed port
      },
    },
  ],
};
