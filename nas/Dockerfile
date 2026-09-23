FROM node:22-alpine
WORKDIR /app
COPY statistik.js index.html ./
USER node
EXPOSE 8080
CMD ["node", "statistik.js"]
