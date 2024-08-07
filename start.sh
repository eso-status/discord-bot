#!/bin/sh

# SETUP ENV FILE
cat ./.env.example > ./.env
sed -i -e "s/__NODE_ENV__/$NODE_ENV/g" ./.env
sed -i -e "s/__APP_NAME__/$APP_NAME/g" ./.env
sed -i -e "s/__DB_TYPE__/$DB_TYPE/g" ./.env
sed -i -e "s/__DB_HOST__/$DB_HOST/g" ./.env
sed -i -e "s/__DB_PORT__/$DB_PORT/g" ./.env
sed -i -e "s/__DB_NAME__/$DB_NAME/g" ./.env
sed -i -e "s/__DB_USER__/$DB_USER/g" ./.env
sed -i -e "s/__DB_PASSWORD__/$DB_PASSWORD/g" ./.env
sed -i -e "s/__DB_DEBUG__/$DB_DEBUG/g" ./.env
sed -i -e "s/__DISCORD_TOKEN__/$DISCORD_TOKEN/g" ./.env
sed -i -e "s/__DISCORD_TESTING_GUILDID__/$DISCORD_TESTING_GUILDID/g" ./.env
sed -i -e "s/__DISCORD_TESTING_CHANNELID__/$DISCORD_TESTING_CHANNELID/g" ./.env
sed -i -e "s/__AWS_ACCESS_KEY_ID__/$AWS_ACCESS_KEY_ID/g" ./.env
sed -i -e "s/__AWS_SECRET_ACCESS_KEY__/$AWS_SECRET_ACCESS_KEY/g" ./.env
sed -i -e "s/__AWS_REGION__/$AWS_REGION/g" ./.env
sed -i -e "s/__CLOUDWATCH_GROUP_NAME__/$CLOUDWATCH_GROUP_NAME/g" ./.env
sed -i -e "s/__CLOUDWATCH_STREAM_NAME__/$CLOUDWATCH_STREAM_NAME/g" ./.env

## RUN DATABASE MIGRATION
npm run migration:run

## START APPLICATION
npm run start:prod
