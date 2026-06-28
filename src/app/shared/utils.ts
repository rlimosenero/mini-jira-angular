import { COLORS } from './models';

const AVATAR_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red, COLORS.slate];

export function colorFor(name: string | undefined | null): string {
  if (!name) return COLORS.slate;
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[Math.abs(h)];
}

export function initials(name: string | undefined | null): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

export function keyFromName(name: string, existingKeys: string[]): string {
  const base = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'PRJ';
  let key = base;
  let n = 1;
  while (existingKeys.includes(key)) {
    key = base.slice(0, 2) + n;
    n++;
  }
  return key;
}
