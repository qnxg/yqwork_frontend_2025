FROM node:iron-trixie-slim
WORKDIR /app
COPY deploy/ .
RUN chown -R node:node /app
USER node
CMD ["node", "server.js"]