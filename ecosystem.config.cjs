module.exports = {
  apps: [
    {
      name: "pedihub",
      script: ".output/server/index.mjs",
      cwd: "/var/www/pedihub-app",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
