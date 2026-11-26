export const esc = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);

export const zai = (value: number): string => `${value.toLocaleString('en-GB')}`;

export const clock = (ms: number): string => {
  const safe = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const signed = (value: number): string => `${value > 0 ? '+' : ''}${zai(value)}`;
