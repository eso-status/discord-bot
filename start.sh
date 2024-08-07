#!/bin/sh

# SETUP ENV FILE
cat ./.env.example > ./.env
sed -i -e "s/__DB_TYPE__/$DB_TYPE/g" ./.env
sed -i -e "s/__DB_HOST__/$DB_HOST/g" ./.env
sed -i -e "s/__DB_PORT__/$DB_PORT/g" ./.env
sed -i -e "s/__DB_NAME__/$DB_NAME/g" ./.env
sed -i -e "s/__DB_USER__/$DB_USER/g" ./.env
sed -i -e "s/__DB_PASSWORD__/$DB_PASSWORD/g" ./.env
sed -i -e "s/__DB_DEBUG__/$DB_DEBUG/g" ./.env
sed -i -e "s/__DISCORD_TOKEN__/$DISCORD_TOKEN/g" ./.env
sed -i -e "s/__DISCORD_TESTING_GUILDID__//g" ./.env
sed -i -e "s/__DISCORD_TESTING_CHANNELID__//g" ./.env

## RUN DATABASE MIGRATION
npm run migration:run

## START APPLICATION
npm run start:prod
