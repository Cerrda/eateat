import { clipGraphemes } from './text.js';

export interface ExtractedRecipe {
  name: string;
  summary: string;
  ingredients: string;
  steps: string[];
  durationMinutes: number | null;
}

const EMPTY: ExtractedRecipe = {
  name: '',
  summary: '',
  ingredients: '',
  steps: [],
  durationMinutes: null,
};

export function extractRecipe(html: string): ExtractedRecipe {
  const title = clipGraphemes(metaContent(html, 'og:title') || tagText(html, 'title'), 20);
  const description = decodeBasic(metaContent(html, 'og:description') || metaContent(html, 'description'));
  const durationMatch = description.match(/(\d{1,3})\s*分钟/);
  const durationMinutes = durationMatch ? Number(durationMatch[1]) : null;
  const ingredients = ingredientsFrom(description);
  const steps = stepsFrom(description);

  return {
    name: title,
    summary: clipGraphemes(description, 80),
    ingredients,
    steps,
    durationMinutes: durationMinutes && durationMinutes > 0 && durationMinutes <= 600 ? durationMinutes : null,
  };
}

export function recipeHasDraftStart(recipe: ExtractedRecipe): boolean {
  return recipe.name.length > 0 || recipe.steps.length > 0;
}

function metaContent(html: string, key: string): string {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["']`,
    'i',
  );
  const match = html.match(pattern);
  return decodeBasic(match?.[1] || match?.[2] || '');
}

function tagText(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  return decodeBasic(match?.[1] ?? '');
}

function ingredientsFrom(description: string): string {
  const match = description.match(/食材[:：]\s*([^\n。]{1,200})/);
  if (!match?.[1]) return '';
  return match[1]
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 40)
    .join('\n');
}

function stepsFrom(description: string): string[] {
  const stepBlock = description.split(/步骤[:：]/)[1] ?? description;
  const pieces = stepBlock
    .split(/\n+|。|(?:^|\s)\d+[.、]/)
    .map((item) => item.replace(/<[^>]+>/g, '').trim())
    .filter((item) => item.length > 1);

  return pieces.slice(0, 30).map((item) => clipGraphemes(item, 200));
}

function decodeBasic(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export { EMPTY as emptyRecipe };
