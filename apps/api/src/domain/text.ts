export function graphemeLength(value: string): number {
  return Array.from(value.trim()).length;
}

export function assertDisplayName(value: string): string {
  const name = value.trim();
  const length = Array.from(name).length;
  if (length < 2 || length > 8) {
    throw new Error('称呼要在 2 到 8 个字');
  }
  return name;
}

export function assertShortMessage(value: string, max: number): string {
  const message = value.trim();
  const length = Array.from(message).length;
  if (length < 1 || length > max) {
    throw new Error(`留一句话，最多 ${max} 个字`);
  }
  return message;
}

export function clipGraphemes(value: string, max: number): string {
  return Array.from(value.trim()).slice(0, max).join('');
}
