export type LinkKind = 'xiaohongshu' | 'douyin' | 'other' | 'invalid';

export function classifyRecipeUrl(raw: string): LinkKind {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return 'invalid';
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'invalid';
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (
    host === 'xiaohongshu.com' ||
    host.endsWith('.xiaohongshu.com') ||
    host === 'xhslink.com' ||
    host.endsWith('.xhslink.com')
  ) {
    return 'xiaohongshu';
  }

  if (
    host === 'douyin.com' ||
    host.endsWith('.douyin.com') ||
    host === 'iesdouyin.com' ||
    host.endsWith('.iesdouyin.com')
  ) {
    return 'douyin';
  }

  return 'other';
}

export function canRequestParse(kind: LinkKind): boolean {
  return kind === 'xiaohongshu' || kind === 'douyin';
}
