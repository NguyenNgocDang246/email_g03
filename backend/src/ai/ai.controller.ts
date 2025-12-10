import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import type { Request } from 'express';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('search')
  async semanticSearch(@Body() body, @Req() req: Request) {
    const { query, mailboxId } = body || {};
    const data = req['user'];
    const userId = data?.id;
    // userId currently unused, but reserved for future personalized search
    const results = await this.aiService.semanticSearch(mailboxId, query);
    return { data: results, userId };
  }

  @Post('emails/:id/summarize')
  async summarize(@Param('id') id: string, @Req() req: Request) {
    const data = req['user'];
    const userId = data?.id;
    const summary = await this.aiService.summarizeEmail(id, userId);
    return summary ?? { summary: 'Email not found', metadata: {} };
  }
}
