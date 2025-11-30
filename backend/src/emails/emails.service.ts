import { Injectable, NotFoundException } from '@nestjs/common';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { AuthService } from 'src/auth/auth.service';
import { EmailDetailMapper } from 'src/mappers';

@Injectable()
export class EmailsService {
  private cache = new Map();

  constructor(private authService: AuthService) {
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

  async getEmailDetail(id: string, userId: string) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;

    const emailDetail = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full',
    });

    const emailDetailMapped = EmailDetailMapper.toEmailDetail(
      emailDetail.data,
      undefined,
    );

    return emailDetailMapped;
  }
}
