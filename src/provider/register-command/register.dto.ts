import { Choice, Param, ParamType } from '@discord-nestjs/core';
import {
  ServerPcEuSlug,
  ServerPcNaSlug,
  ServerPcPtsSlug,
  ServerPsEuSlug,
  ServerPsNaSlug,
  ServerXboxEuSlug,
  ServerXboxNaSlug,
  ServiceStoreCrownSlug,
  ServiceStoreEsoSlug,
  ServiceSystemAccountSlug,
  ServiceWebForumSlug,
  ServiceWebSiteSlug,
  Slug as SlugEsoStatus,
} from '@eso-status/types';

enum Event {
  maintenancePlanned = 'maintenancePlanned',
  statusUpdate = 'statusUpdate',
  disconnect = 'disconnect',
  reconnect = 'reconnect',
}

const Slug: Record<string, string> = {
  ServerXboxNaSlug,
  ServerXboxEuSlug,
  ServerPsNaSlug,
  ServerPsEuSlug,
  ServerPcNaSlug,
  ServerPcEuSlug,
  ServerPcPtsSlug,
  ServiceWebSiteSlug,
  ServiceWebForumSlug,
  ServiceStoreCrownSlug,
  ServiceStoreEsoSlug,
  ServiceSystemAccountSlug,
};

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
  public slug: SlugEsoStatus = <SlugEsoStatus>'all';
}
