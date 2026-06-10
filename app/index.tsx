import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDailyTheme } from '../src/hooks/useDailyTheme';
import { useStreak } from '../src/hooks/useStreak';
import { usePhotoStorage } from '../src/hooks/usePhotoStorage';
import { getContrastColor, hexWithOpacity } from '../src/utils/colorUtils';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 48) / 3;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const { dailyTheme, loading } = useDailyTheme();
  const { progress } = useStreak();
  const { photos } = usePhotoStorage();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    scheduleDailyNotification();
  }, []);

  async function scheduleDailyNotification() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📸 Color Hunt',
        body: dailyTheme
          ? `今日のテーマカラーは「${dailyTheme.colorName}」です。探しに行きましょう！`
          : '今日のテーマカラーを確認しましょう！',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });
  }

  function onPressCamera() {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => router.push('/camera'));
  }

  if (loading || !dailyTheme) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const contrastColor = getContrastColor(dailyTheme.hexColor);
  const todayPhotos = photos.filter((p) => p.date === dailyTheme.date);

  return (
    <LinearGradient
      colors={[dailyTheme.hexColor, hexWithOpacity(dailyTheme.hexColor, 0.3), '#0a0a0a']}
      locations={[0, 0.4, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>COLOR HUNT</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('ja-JP', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </Text>
          </View>

          {/* Today's Color Card */}
          <View style={styles.colorCard}>
            <BlurView intensity={20} tint="dark" style={styles.blurCard}>
              <View style={styles.colorCardInner}>
                <View style={[styles.colorSwatch, { backgroundColor: dailyTheme.hexColor }]}>
                  {dailyTheme.isCaptured && (
                    <Text style={[styles.capturedCheck, { color: contrastColor }]}>✓</Text>
                  )}
                </View>
                <View style={styles.colorInfo}>
                  <Text style={styles.colorLabel}>Today's Color</Text>
                  <Text style={styles.colorName}>{dailyTheme.colorName}</Text>
                  <Text style={styles.colorHex}>{dailyTheme.hexColor}</Text>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Streak Badge */}
          <View style={styles.streakRow}>
            <BlurView intensity={20} tint="dark" style={styles.streakCard}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View>
                <Text style={styles.streakCount}>{progress.currentStreak}</Text>
                <Text style={styles.streakLabel}>日連続</Text>
              </View>
            </BlurView>
            <BlurView intensity={20} tint="dark" style={styles.streakCard}>
              <Text style={styles.streakEmoji}>🏆</Text>
              <View>
                <Text style={styles.streakCount}>{progress.longestStreak}</Text>
                <Text style={styles.streakLabel}>最長記録</Text>
              </View>
            </BlurView>
            <BlurView intensity={20} tint="dark" style={styles.streakCard}>
              <Text style={styles.streakEmoji}>📸</Text>
              <View>
                <Text style={styles.streakCount}>{photos.length}</Text>
                <Text style={styles.streakLabel}>総撮影数</Text>
              </View>
            </BlurView>
          </View>

          {/* Gallery Preview */}
          <View style={styles.gallerySection}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>Today's Shots</Text>
              <TouchableOpacity onPress={() => router.push('/gallery')}>
                <Text style={[styles.galleryMore, { color: dailyTheme.hexColor }]}>すべて見る →</Text>
              </TouchableOpacity>
            </View>
            {todayPhotos.length === 0 ? (
              <View style={styles.emptyGallery}>
                <Text style={styles.emptyText}>まだ写真がありません</Text>
                <Text style={styles.emptySubText}>今日のテーマカラーを探して撮影しましょう</Text>
              </View>
            ) : (
              <FlatList
                data={todayPhotos.slice(0, 6)}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                )}
                contentContainerStyle={styles.grid}
              />
            )}
          </View>

          {/* Camera Button */}
          <View style={styles.cameraButtonContainer}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                onPress={onPressCamera}
                style={[styles.cameraButton, { backgroundColor: dailyTheme.hexColor }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.cameraButtonText, { color: contrastColor }]}>📷 撮影する</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 16 },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },
  header: { marginTop: 8, marginBottom: 20 },
  appTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  dateText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  colorCard: { marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  blurCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  colorCardInner: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  colorSwatch: { width: 72, height: 72, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  capturedCheck: { fontSize: 32, fontWeight: 'bold' },
  colorInfo: { flex: 1 },
  colorLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  colorName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  colorHex: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  streakRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  streakCard: { flex: 1, borderRadius: 16, overflow: 'hidden', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  streakEmoji: { fontSize: 22 },
  streakCount: { color: '#fff', fontSize: 20, fontWeight: '800' },
  streakLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  gallerySection: { flex: 1 },
  galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  galleryTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  galleryMore: { fontSize: 13, fontWeight: '600' },
  emptyGallery: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 8, textAlign: 'center' },
  grid: { gap: 4 },
  thumbnail: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: 8, margin: 2 },
  cameraButtonContainer: { paddingBottom: 16, paddingTop: 12 },
  cameraButton: { borderRadius: 20, paddingVertical: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  cameraButtonText: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});
