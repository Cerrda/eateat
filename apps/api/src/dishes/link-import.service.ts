import { Injectable, Logger } from '@nestjs/common';
import { extractRecipe, recipeHasDraftStart, type ExtractedRecipe } from '../domain/recipe-html.js';

@Injectable()
export class LinkImportService {
  private readonly logger = new Logger(LinkImportService.name);

  async read(url: string): Promise<ExtractedRecipe | null> {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(20_000),
        headers: {
          accept: 'text/html',
          'user-agent': 'EatEat/1.0',
        },
      });
      if (!response.ok) {
        this.logger.warn(`link parse failed status=${response.status}`);
        return null;
      }
      const html = (await response.text()).slice(0, 500_000);
      const recipe = extractRecipe(html);
      return recipeHasDraftStart(recipe) ? recipe : null;
    } catch (error) {
      this.logger.warn(`link parse failed ${error instanceof Error ? error.name : 'error'}`);
      return null;
    }
  }
}
