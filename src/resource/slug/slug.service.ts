import { Slug as EsoStatusSlug } from '@eso-status/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Slug } from './entities/slug.entity';

@Injectable()
export class SlugService {
  constructor(
    @InjectRepository(Slug)
    private readonly slugRepository: Repository<Slug>,
  ) {}

  async getAll(): Promise<Slug[]> {
    return this.slugRepository.find();
  }

  async getBySlug(slug: EsoStatusSlug): Promise<Slug> {
    return this.slugRepository.findOne({
      where: {
        slug,
      },
    });
  }
}
