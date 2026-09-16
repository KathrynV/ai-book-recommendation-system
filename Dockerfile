FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public
COPY demo-data ./demo-data
COPY mcp ./mcp
COPY server.js ./

ENV PORT=3000
EXPOSE 3000

CMD ["node", "--use-system-ca", "server.js"]
