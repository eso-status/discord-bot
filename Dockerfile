FROM node:20.16.0-alpine3.20

WORKDIR /eso-status

COPY ./dist/ ./dist/
COPY ./node_modules/ ./node_modules/
COPY ./.env.example .
COPY ./package.json .
COPY ./start.sh /tmp/start.sh

RUN chown node:node -R ./
RUN chown node:node -R /tmp/start.sh

USER node

# Execute start script
ENTRYPOINT ["/bin/sh", "/tmp/start.sh"]
