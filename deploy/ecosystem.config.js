module.exports = {
  apps: [
    {
      name: "shadowing-backend",
      script: "uvicorn",
      args: "app.main:app --host 127.0.0.1 --port 8000 --workers 2",
      cwd: "/app/backend",
      interpreter: "/app/backend/.venv/bin/python",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
    },
    {
      name: "shadowing-frontend",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/app/frontend",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
    },
  ],
};
