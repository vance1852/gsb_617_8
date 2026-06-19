FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ wget

COPY package.json ./
RUN npm install --only=production

COPY src/ ./src/

RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/shorturl.db

EXPOSE 3001

CMD ["node", "src/index.js"]
