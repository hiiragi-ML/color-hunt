const COLOR_PALETTE: { hex: string; name: string }[] = [
  { hex: '#FF6B6B', name: 'コーラルレッド' },
  { hex: '#FF8E53', name: 'サンセットオレンジ' },
  { hex: '#FFD93D', name: 'サニーイエロー' },
  { hex: '#6BCB77', name: 'フレッシュグリーン' },
  { hex: '#4D96FF', name: 'スカイブルー' },
  { hex: '#845EC2', name: 'ディープパープル' },
  { hex: '#FF9671', name: 'ピーチ' },
  { hex: '#F9F871', name: 'レモン' },
  { hex: '#00C9A7', name: 'ミント' },
  { hex: '#C34B4B', name: 'バーガンディ' },
  { hex: '#008F7A', name: 'ティール' },
  { hex: '#0081CF', name: 'オーシャンブルー' },
  { hex: '#D65DB1', name: 'フューシャ' },
  { hex: '#FF6F91', name: 'ホットピンク' },
  { hex: '#926C00', name: 'アンバー' },
  { hex: '#2C73D2', name: 'ロイヤルブルー' },
  { hex: '#3D9970', name: 'フォレストグリーン' },
  { hex: '#FF4136', name: 'チェリーレッド' },
  { hex: '#7FDBFF', name: 'ライトシアン' },
  { hex: '#B10DC9', name: 'バイオレット' },
  { hex: '#01FF70', name: 'ライムグリーン' },
  { hex: '#FFDC00', name: 'ゴールデンイエロー' },
  { hex: '#F012BE', name: 'マゼンタ' },
  { hex: '#FF851B', name: 'タンジェリン' },
  { hex: '#85144B', name: 'マルーン' },
  { hex: '#3D9AC8', name: 'セルリアンブルー' },
  { hex: '#E8A838', name: 'マリーゴールド' },
  { hex: '#8D6E63', name: 'モカブラウン' },
  { hex: '#78909C', name: 'スレートグレー' },
  { hex: '#E91E63', name: 'ローズピンク' },
];

export function getDailyThemeColor(date: Date = new Date()): { hex: string; name: string } {
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function hexWithOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}
