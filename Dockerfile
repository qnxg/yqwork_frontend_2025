FROM node:iron-trixie-slim
WORKDIR /app
COPY deploy/ .
USER node
CMD ["node", "server.js"]