import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePhotoStorage } from '../src/hooks/usePhotoStorage';
import { PhotoRecord } from '../src/types';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 48) / 3;

interface Album {
  colorHex: string;
  photos: PhotoRecord[];
}

export default function GalleryScreen() {
  const { photos } = usePhotoStorage();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (selectedPhoto) {
      Animated.timing(modalFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      modalFade.setValue(0);
    }
  }, [selectedPhoto]);

  const albums = buildAlbums(photos);
  const filteredPhotos = selectedColor
    ? photos.filter((p) => p.themeColorHex === selectedColor)
    : photos;

  return (
    <LinearGradient colors={['#0a0a0a', '#111']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Gallery</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Album Filter */}
          <FlatList
            horizontal
            data={[null, ...albums]}
            keyExtractor={(item) => item?.colorHex ?? 'all'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.albumList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedColor(item?.colorHex ?? null)}
                style={[
                  styles.albumChip,
                  (item?.colorHex ?? null) === selectedColor && styles.albumChipActive,
                ]}
              >
                {item ? (
                  <View style={[styles.chipColor, { backgroundColor: item.colorHex }]} />
                ) : (
                  <Text style={styles.chipAllText}>🎨</Text>
                )}
                <Text style={styles.chipCount}>
                  {item ? item.photos.length : photos.length}
                </Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {filteredPhotos.length}枚の写真 · {albums.length}色
            </Text>
          </View>

          {filteredPhotos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📷</Text>
              <Text style={styles.emptyText}>写真がまだありません</Text>
              <Text style={styles.emptySubText}>カメラで今日のテーマカラーを撮影しましょう</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPhotos}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setSelectedPhoto(item)}>
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                  <View style={[styles.colorDot, { backgroundColor: item.themeColorHex }]} />
                </TouchableOpacity>
              )}
            />
          )}
        </Animated.View>

        {/* Photo Viewer Modal */}
        <Modal visible={!!selectedPhoto} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill as any} />
            {selectedPhoto && (
              <Animated.View style={[styles.modalContent, { opacity: modalFade }]}>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.fullImage} resizeMode="contain" />
                <View style={styles.modalInfo}>
                  <View style={[styles.modalColorDot, { backgroundColor: selectedPhoto.themeColorHex }]} />
                  <Text style={styles.modalDate}>{selectedPhoto.date}</Text>
                  <Text style={styles.modalColorHex}>{selectedPhoto.themeColorHex}</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedPhoto(null)}>
                  <Text style={styles.closeButtonText}>✕ 閉じる</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function buildAlbums(photos: PhotoRecord[]): Album[] {
  const map = new Map<string, PhotoRecord[]>();
  for (const p of photos) {
    const arr = map.get(p.themeColorHex) ?? [];
    arr.push(p);
    map.set(p.themeColorHex, arr);
  }
  return Array.from(map.entries()).map(([colorHex, ps]) => ({ colorHex, photos: ps }));
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 60 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  albumList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  albumChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  albumChipActive: { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.15)' },
  chipColor: { width: 16, height: 16, borderRadius: 8 },
  chipAllText: { fontSize: 14 },
  chipCount: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsRow: { paddingHorizontal: 16, paddingBottom: 8 },
  statsText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  grid: { paddingHorizontal: 12, paddingBottom: 20 },
  thumbnail: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: 8, margin: 2 },
  colorDot: { position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: '#fff' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '700' },
  emptySubText: { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width, alignItems: 'center' },
  fullImage: { width: width, height: width, marginBottom: 20 },
  modalInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  modalColorDot: { width: 20, height: 20, borderRadius: 10 },
  modalDate: { color: '#fff', fontSize: 14 },
  modalColorHex: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  closeButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  closeButtonText: { color: '#fff', fontWeight: '600' },
});
