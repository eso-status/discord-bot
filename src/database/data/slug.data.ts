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
} from '@eso-status/types';

import { Slug } from '../../resource/slug/entities/slug.entity';

export const slugData: Slug[] = [
  {
    id: 1,
    slug: ServerXboxNaSlug,
  },
  {
    id: 2,
    slug: ServerXboxEuSlug,
  },
  {
    id: 3,
    slug: ServerPsNaSlug,
  },
  {
    id: 4,
    slug: ServerPsEuSlug,
  },
  {
    id: 5,
    slug: ServerPcNaSlug,
  },
  {
    id: 6,
    slug: ServerPcEuSlug,
  },
  {
    id: 7,
    slug: ServerPcPtsSlug,
  },
  {
    id: 8,
    slug: ServiceWebSiteSlug,
  },
  {
    id: 9,
    slug: ServiceWebForumSlug,
  },
  {
    id: 10,
    slug: ServiceStoreCrownSlug,
  },
  {
    id: 11,
    slug: ServiceStoreEsoSlug,
  },
  {
    id: 12,
    slug: ServiceSystemAccountSlug,
  },
];
