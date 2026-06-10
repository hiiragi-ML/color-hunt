import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhotoRecord } from '../types';

const PHOTOS_KEY = '@color_hunt:photos';

export function usePhotoStorage() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
      const stored = await AsyncStorage.getItem(PHOTOS_KEY);
      if (stored) setPhotos(JSON.parse(stored));
    } catch (e) {
      // silent
    }
  }

  async function addPhoto(record: PhotoRecord) {
    try {
      const updated = [record, ...photos];
      await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(updated));
      setPhotos(updated);
    } catch (e) {
      // silent
    }
  }

  async function refreshPhotos() {
    await loadPhotos();
  }

  return { photos, addPhoto, refreshPhotos };
}
