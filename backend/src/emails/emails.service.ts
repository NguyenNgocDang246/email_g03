import { Injectable, NotFoundException } from '@nestjs/common';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailsService {
  private cache = new Map();

  constructor() {
    this.loadMockFiles();
  }

  private loadMockFiles() {
    const basePath = join(__dirname, '..', 'mock', 'email-details');
    const files = readdirSync(basePath);

    for (const filename of files) {
      const data = readFileSync(join(basePath, filename), 'utf-8');
      const json = JSON.parse(data);

      this.cache.set(json.id, json);
    }
  }

  async getEmailDetail(id: string) {
    const emailDetail = this.cache.get(id);

    if (!emailDetail) {
      throw new NotFoundException('Email detail not found');
    }

    return emailDetail;
  }
}
