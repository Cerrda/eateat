import { describe, expect, it } from 'vitest';
import { coversRemaining, publishBlockers } from './dish-rules.js';
import { classifyRecipeUrl } from './links.js';
import { canOpenAnotherOrder, transitionError } from './order-rules.js';
import { extractRecipe } from './recipe-html.js';
import { renderDishCover } from './cover-art.js';
import { isOrderDate, orderDateWindow } from './calendar.js';
import { assertDisplayName, assertShortMessage } from './text.js';
import { cookerTodoBadge, eaterOrderBadge, recordBadge } from './badges.js';

describe('kitchen rules', () => {
  it('only accepts xiaohongshu and douyin hosts', () => {
    expect(classifyRecipeUrl('https://www.xiaohongshu.com/explore/abc')).toBe('xiaohongshu');
    expect(classifyRecipeUrl('https://xhslink.com/a/abc')).toBe('xiaohongshu');
    expect(classifyRecipeUrl('https://v.douyin.com/abc')).toBe('douyin');
    expect(classifyRecipeUrl('https://www.iesdouyin.com/share/video/1')).toBe('douyin');
    expect(classifyRecipeUrl('https://example.com/recipe')).toBe('other');
    expect(classifyRecipeUrl('not a url')).toBe('invalid');
  });

  it('blocks publish until name, cover, and summary or steps exist', () => {
    expect(publishBlockers({ name: '番茄炒蛋', summary: '', steps: [], coverPath: null })).toEqual([
      '还缺封面',
      '简介和步骤至少写一项',
    ]);
    expect(
      publishBlockers({ name: '番茄炒蛋', summary: '家常', steps: [], coverPath: '/api/v1/media/a.svg' }),
    ).toEqual([]);
  });

  it('limits cover regeneration to five a day', () => {
    expect(coversRemaining(0)).toBe(5);
    expect(coversRemaining(5)).toBe(0);
  });

  it('allows another order only after a terminal state', () => {
    expect(canOpenAnotherOrder('PENDING')).toBe(false);
    expect(canOpenAnotherOrder('ACCEPTED')).toBe(false);
    expect(canOpenAnotherOrder('REJECTED')).toBe(true);
    expect(canOpenAnotherOrder('COMPLETED')).toBe(true);
    expect(canOpenAnotherOrder('CANCELLED')).toBe(true);
  });

  it('keeps order transitions on the cooker except cancel', () => {
    expect(transitionError('PENDING', 'accept', 'EATER')).toBe('这一边做不了这件事');
    expect(transitionError('PENDING', 'reject', 'COOKER')).toBeNull();
    expect(transitionError('ACCEPTED', 'complete', 'COOKER')).toBeNull();
    expect(transitionError('PENDING', 'cancel', 'EATER')).toBeNull();
    expect(transitionError('COMPLETED', 'cancel', 'COOKER')).toBe('这一餐已经结束，不能取消');
  });

  it('extracts a private draft from page text and draws a cover without lettering', () => {
    const recipe = extractRecipe(`
      <html><head>
        <meta property="og:title" content="番茄炒蛋"/>
        <meta property="og:description" content="食材：番茄、鸡蛋。步骤：热锅。炒匀。15分钟"/>
      </head></html>
    `);
    expect(recipe.name).toBe('番茄炒蛋');
    expect(recipe.ingredients).toContain('番茄');
    expect(recipe.steps.length).toBeGreaterThan(0);
    expect(recipe.durationMinutes).toBe(15);

    const svg = renderDishCover('番茄炒蛋 番茄 鸡蛋');
    expect(svg).toContain('viewBox="0 0 800 800"');
    expect(svg.toLowerCase()).not.toContain('<text');
    expect(svg).not.toContain('番茄');
  });

  it('only allows today through the day after tomorrow', () => {
    const now = new Date('2026-09-23T02:00:00Z');
    const [today] = orderDateWindow(now);
    expect(today).toBe('2026-09-23');
    expect(isOrderDate('2026-09-25', now)).toBe(true);
    expect(isOrderDate('2026-09-26', now)).toBe(false);
  });

  it('checks names, notes, and badges', () => {
    expect(assertDisplayName(' 做饭的人 ')).toBe('做饭的人');
    expect(() => assertDisplayName('我')).toThrow(/2 到 8/);
    expect(assertShortMessage('今天来不及', 40)).toBe('今天来不及');
    expect(cookerTodoBadge(2)).toBe(2);
    expect(eaterOrderBadge(1)).toBe(1);
    expect(recordBadge(0)).toBe(0);
  });
});
