FROM node:20.16.0-alpine3.20

RUN apk add --no-cache libcap

WORKDIR /eso-status

EXPOSE 443

COPY ./dist/ ./dist/
COPY ./node_modules/ ./node_modules/
COPY ./.env.example .
COPY ./package.json .
COPY ./start.sh /tmp/start.sh

RUN setcap 'cap_net_bind_service=+ep' `readlink -f \`which node\`` \
&& chown node:node -R ./ \
&& chown node:node -R /tmp/start.sh

USER node

# Execute start script
ENTRYPOINT ["/bin/sh", "/tmp/start.sh"]
