import EsoStatus, {
  EsoStatusMaintenance,
  Slug as EsoStatusSlug,
} from '@eso-status/types';

export type EsoStatusDataType =
  | EsoStatus
  | EsoStatusMaintenance
  | EsoStatusSlug;
