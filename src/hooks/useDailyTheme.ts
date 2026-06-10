import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyTheme } from '../types';
import { getDailyThemeColor, getTodayDateString } from '../utils/colorUtils';

const DAILY_THEME_KEY = '@color_hunt:daily_theme';

export function useDailyTheme() {
  const [dailyTheme, setDailyTheme] = useState<DailyTheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrCreateTheme();
  }, []);

  async function loadOrCreateTheme() {
    try {
      const today = getTodayDateString();
      const stored = await AsyncStorage.getItem(DAILY_THEME_KEY);

      if (stored) {
        const parsed: DailyTheme = JSON.parse(stored);
        if (parsed.date === today) {
          setDailyTheme(parsed);
          setLoading(false);
          return;
        }
      }

      const color = getDailyThemeColor(new Date());
      const newTheme: DailyTheme = {
        date: today,
        hexColor: color.hex,
        colorName: color.name,
        isCaptured: false,
      };
      await AsyncStorage.setItem(DAILY_THEME_KEY, JSON.stringify(newTheme));
      setDailyTheme(newTheme);
    } catch (e) {
      const color = getDailyThemeColor(new Date());
      setDailyTheme({
        date: getTodayDateString(),
        hexColor: color.hex,
        colorName: color.name,
        isCaptured: false,
      });
    } finally {
      setLoading(false);
    }
  }

  async function markCaptured() {
    if (!dailyTheme) return;
    const updated = { ...dailyTheme, isCaptured: true };
    await AsyncStorage.setItem(DAILY_THEME_KEY, JSON.stringify(updated));
    setDailyTheme(updated);
  }

  return { dailyTheme, loading, markCaptured };
}
