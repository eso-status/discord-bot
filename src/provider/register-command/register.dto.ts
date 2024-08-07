import { Choice, Param, ParamType } from '@discord-nestjs/core';

export enum Event {
  maintenancePlanned = 'maintenancePlanned',
  statusUpdate = 'statusUpdate',
  disconnect = 'disconnect',
  reconnect = 'reconnect',
}

export enum Slug {
  server_xbox_na = 'server_xbox_na',
  server_xbox_eu = 'server_xbox_eu',
  server_ps_na = 'server_ps_na',
  server_ps_eu = 'server_ps_eu',
  server_pc_na = 'server_pc_na',
  server_pc_eu = 'server_pc_eu',
  server_pc_pts = 'server_pc_pts',
  service_web_site = 'service_web_site',
  service_web_forum = 'service_web_forum',
  service_store_crown = 'service_store_crown',
  service_store_eso = 'service_store_eso',
  service_system_account = 'service_system_account',
}

export class RegisterDto {
  @Choice(Event)
  @Param({
    name: 'event',
    description: 'EsoStatus event',
    type: ParamType.STRING,
  })
  public event: Event = <Event>'all';

  @Choice(Slug)
  @Param({
    name: 'slug',
    description: 'EsoStatus slug',
    type: ParamType.STRING,
  })
  public slug: Slug = <Slug>'all';
}
