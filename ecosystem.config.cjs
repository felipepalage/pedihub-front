module.exports = {
  apps: [
    {
      name: "pedihub",
      script: "server-start.mjs",
      cwd: "/var/www/pedihub-app",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
