import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress } from '../types';
import { getTodayDateString } from '../utils/colorUtils';

const PROGRESS_KEY = '@color_hunt:user_progress';

export function useStreak() {
  const [progress, setProgress] = useState<UserProgress>({
    currentStreak: 0,
    longestStreak: 0,
    lastCaptureDate: null,
  });

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      const stored = await AsyncStorage.getItem(PROGRESS_KEY);
      if (stored) {
        const parsed: UserProgress = JSON.parse(stored);
        const today = getTodayDateString();
        const yesterday = getYesterday();

        if (parsed.lastCaptureDate !== today && parsed.lastCaptureDate !== yesterday) {
          const reset = { ...parsed, currentStreak: 0 };
          setProgress(reset);
          await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(reset));
        } else {
          setProgress(parsed);
        }
      }
    } catch (e) {
      // use default
    }
  }

  async function recordCapture() {
    try {
      const today = getTodayDateString();
      const stored = await AsyncStorage.getItem(PROGRESS_KEY);
      let current: UserProgress = stored
        ? JSON.parse(stored)
        : { currentStreak: 0, longestStreak: 0, lastCaptureDate: null };

      if (current.lastCaptureDate === today) return;

      const yesterday = getYesterday();
      const newStreak =
        current.lastCaptureDate === yesterday ? current.currentStreak + 1 : 1;
      const updated: UserProgress = {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, current.longestStreak),
        lastCaptureDate: today,
      };
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      setProgress(updated);
    } catch (e) {
      // silent
    }
  }

  return { progress, recordCapture };
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
