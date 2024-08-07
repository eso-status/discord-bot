import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EventType } from '../../type/event.type';

import { Event } from './entities/event.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  public async getAll(): Promise<Event[]> {
    return this.eventRepository.find();
  }

  public async getByEvent(event: EventType): Promise<Event> {
    return this.eventRepository.findOne({
      where: {
        event,
      },
    });
  }
}
