#!/bin/sh
set -e

node node_modules/typeorm/cli.js migration:run -d ./dist/config/typeorm.config.js

exec node dist/main
