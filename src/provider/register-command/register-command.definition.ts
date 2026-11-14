import { Slug as EsoStatusSlug } from '@eso-status/types';
import {
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandStringOption,
} from 'discord.js';

import { EventType } from '../../type/event.type';

const eventChoiceList: EventType[] = [
  'maintenancePlanned',
  'statusUpdate',
  'disconnect',
  'reconnect',
];

const slugChoiceList: EsoStatusSlug[] = [
  'server_xbox_na',
  'server_xbox_eu',
  'server_ps_na',
  'server_ps_eu',
  'server_pc_na',
  'server_pc_eu',
  'server_pc_pts',
  'service_web_site',
  'service_web_forum',
  'service_store_crown',
  'service_store_eso',
  'service_system_account',
];

export const registerCommandDefinition: RESTPostAPIChatInputApplicationCommandsJSONBody =
  new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register to received EsoStatus event')
    .addStringOption(
      (option: SlashCommandStringOption): SlashCommandStringOption =>
        option
          .setName('event')
          .setDescription('EsoStatus event')
          .setRequired(false)
          .addChoices(
            ...eventChoiceList.map(
              (event: EventType): { name: string; value: string } => ({
                name: event,
                value: event,
              }),
            ),
          ),
    )
    .addStringOption(
      (option: SlashCommandStringOption): SlashCommandStringOption =>
        option
          .setName('slug')
          .setDescription('EsoStatus slug')
          .setRequired(false)
          .addChoices(
            ...slugChoiceList.map(
              (slug: EsoStatusSlug): { name: string; value: string } => ({
                name: slug,
                value: slug,
              }),
            ),
          ),
    )
    .toJSON();
