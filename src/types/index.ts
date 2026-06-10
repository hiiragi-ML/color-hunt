export interface DailyTheme {
  date: string;
  hexColor: string;
  colorName: string;
  isCaptured: boolean;
}

export interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  lastCaptureDate: string | null;
}

export interface PhotoRecord {
  id: string;
  uri: string;
  date: string;
  themeColorHex: string;
}
