FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node baraka/ ./baraka/
RUN mkdir -p /data && chown node:node /data
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 BARAKA_DATA_DIR=/data
USER node
EXPOSE 3000
CMD ["node", "baraka/server.cjs"]
