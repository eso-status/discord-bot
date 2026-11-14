# --- build stage: compile TypeScript with the full toolchain ---
FROM node:26.13.1-alpine3.24 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# --- production dependencies, installed where npm lives ---
FROM node:26.13.1-alpine3.24 AS production-dependencies

WORKDIR /app

COPY package.json package-lock.json ./
# ⚠️ --omit=optional: TypeORM declares its drivers and ts-node as optional peers, so --omit=dev
# alone still ships better-sqlite3 (with prebuild-install, tar-fs) and ts-node (with typescript).
RUN npm ci --omit=dev --omit=optional --ignore-scripts

# --- runtime: bare Alpine, the node binary and the application, nothing else ---
# ⚠️ Not the node image: it ships npm, whose own dependencies carry advisories that no
# override of ours can reach, and nothing here runs npm. The Alpine release follows the
# variant of the node tag above.
FROM alpine:3.24.4 AS runtime

# libatomic and libstdc++ are what the node image itself installs (nodejs/docker-node):
# ⚠️ `ldd node` on an arm64 machine does not ask for libatomic, the amd64 binary does.
RUN apk upgrade --no-cache \
    && apk add --no-cache libatomic libstdc++ tini tzdata \
    && ln -snf /usr/share/zoneinfo/Europe/Paris /etc/localtime \
    && echo Europe/Paris > /etc/timezone \
    && addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node \
    && mkdir /app \
    && chown node:node /app

COPY --from=build /usr/local/bin/node /usr/local/bin/node

ENV TZ=Europe/Paris

WORKDIR /app

COPY --chown=node:node package.json start.sh ./
COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist

USER node

# ⚠️ tini as PID 1: node there ignores SIGTERM, and Kubernetes would kill it only after its
# 30 s grace period, the old bot still holding the token.
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh", "./start.sh"]
