import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Server } from './entities/server.entity';

@Injectable()
export class ServerService {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async getByServerId(serverId: string): Promise<Server> {
    return this.serverRepository.findOne({
      where: {
        serverId,
      },
    });
  }

  async add(serverId: string): Promise<Server> {
    return this.serverRepository.save(
      this.serverRepository.create({
        serverId,
      }),
    );
  }
}
