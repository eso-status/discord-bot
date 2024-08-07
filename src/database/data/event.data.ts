import { Event } from '../../resource/event/entities/event.entity';

export const eventData: Event[] = [
  {
    id: 1,
    event: 'maintenancePlanned',
  },
  {
    id: 2,
    event: 'maintenanceRemoved',
  },
  {
    id: 3,
    event: 'statusUpdate',
  },
  {
    id: 4,
    event: 'disconnect',
  },
  {
    id: 5,
    event: 'reconnect',
  },
  {
    id: 6,
    event: 'connected',
  },
];
