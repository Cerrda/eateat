function hashString(seed: string): number {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unit(hash: number, salt: number): number {
  const mixed = Math.imul(hash ^ salt, 2246822519) >>> 0;
  return mixed / 4294967295;
}

export function renderDishCover(seed: string): string {
  const hash = hashString(seed || 'eateat');
  const paper = '#FBF3EA';
  const plate = mix('#FFF9F4', '#E4C4AE', unit(hash, 3));
  const sauce = mix('#792B3E', '#E8B4B0', unit(hash, 7));
  const leaf = mix('#7A534C', '#C9A297', unit(hash, 11));
  const crumb = mix('#4E222D', '#E4C4AE', unit(hash, 13));
  const x = 180 + Math.round(unit(hash, 17) * 80);
  const y = 170 + Math.round(unit(hash, 19) * 70);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="${paper}"/>
  <ellipse cx="400" cy="430" rx="250" ry="78" fill="#E4C4AE" opacity="0.45"/>
  <circle cx="400" cy="390" r="214" fill="${plate}"/>
  <circle cx="400" cy="390" r="168" fill="${sauce}" opacity="0.92"/>
  <ellipse cx="${x}" cy="${y}" rx="120" ry="74" fill="${crumb}" opacity="0.8"/>
  <ellipse cx="${640 - x}" cy="${y + 36}" rx="96" ry="58" fill="${leaf}" opacity="0.85"/>
  <circle cx="${x + 40}" cy="${y + 80}" r="28" fill="${paper}" opacity="0.35"/>
</svg>`;
}

function mix(from: string, to: string, t: number): string {
  const a = rgb(from);
  const b = rgb(to);
  const channel = (index: number) => Math.round(a[index] + (b[index] - a[index]) * t);
  return `#${channel(0).toString(16).padStart(2, '0')}${channel(1).toString(16).padStart(2, '0')}${channel(2).toString(16).padStart(2, '0')}`;
}

function rgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}
