FROM node:20.17.0-alpine3.20

RUN apk add --no-cache tzdata \
    && ln -snf /usr/share/zoneinfo/Europe/Paris /etc/localtime \
    && echo Europe/Paris > /etc/timezone

ENV TZ=Europe/Paris

WORKDIR /eso-status

COPY ./dist/ ./dist/
COPY ./node_modules/ ./node_modules/
COPY ./.env.example .
COPY ./package.json .
COPY ./start.sh /tmp/start.sh

RUN chown node:node -R ./ \
&& chown node:node -R /tmp/start.sh

USER node

# Execute start script
ENTRYPOINT ["/bin/sh", "/tmp/start.sh"]
