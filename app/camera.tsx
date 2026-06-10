import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { useDailyTheme } from '../src/hooks/useDailyTheme';
import { useStreak } from '../src/hooks/useStreak';
import { usePhotoStorage } from '../src/hooks/usePhotoStorage';
import { getContrastColor } from '../src/utils/colorUtils';
import { PhotoRecord } from '../src/types';

const { height } = Dimensions.get('window');

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');

  const { dailyTheme, markCaptured } = useDailyTheme();
  const { recordCapture } = useStreak();
  const { addPhoto } = usePhotoStorage();

  const shutterScale = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!mediaPermission?.granted) requestMediaPermission();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  async function takePicture() {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);

    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(shutterScale, { toValue: 1.05, duration: 80, useNativeDriver: true }),
      Animated.timing(shutterScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo) return;

      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }

      const record: PhotoRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        uri: photo.uri,
        date: dailyTheme?.date ?? new Date().toISOString().split('T')[0],
        themeColorHex: dailyTheme?.hexColor ?? '#000000',
      };
      await addPhoto(record);
      await markCaptured();
      await recordCapture();

      Alert.alert('撮影完了！', `${dailyTheme?.colorName ?? 'テーマカラー'}の写真を保存しました 🎉`, [
        { text: 'OK', onPress: () => router.back() },
        { text: '続けて撮る', style: 'cancel' },
      ]);
    } catch (e) {
      Alert.alert('エラー', '撮影に失敗しました');
    } finally {
      setIsCapturing(false);
    }
  }

  if (!cameraPermission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>カメラの使用許可が必要です</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>許可する</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const themeColor = dailyTheme?.hexColor ?? '#FF6B6B';
  const contrastColor = getContrastColor(themeColor);

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash} />

      <Animated.View style={[styles.flashOverlay, { opacity: flashOpacity }]} pointerEvents="none" />

      <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
          <Text style={styles.topButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={[styles.colorBadge, { backgroundColor: themeColor }]}>
          <Text style={[styles.colorBadgeText, { color: contrastColor }]}>
            {dailyTheme?.colorName ?? ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setFlash(flash === 'off' ? 'on' : 'off')} style={styles.topButton}>
          <Text style={styles.topButtonText}>{flash === 'on' ? '⚡️' : '🔦'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.bottomBar, { opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
          style={styles.sideButton}
        >
          <Text style={styles.sideButtonText}>🔄</Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
          <TouchableOpacity
            onPress={takePicture}
            disabled={isCapturing}
            style={styles.shutterOuter}
          >
            <View style={[styles.shutterInner, { backgroundColor: themeColor }]} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.sideButton} />
      </Animated.View>

      <View style={[styles.colorHint, { borderColor: themeColor }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  permissionContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  permissionText: { color: '#fff', fontSize: 16, marginBottom: 20 },
  permissionButton: { backgroundColor: '#FF6B6B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permissionButtonText: { color: '#fff', fontWeight: '700' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff' },
  topBar: { position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  topButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  topButtonText: { fontSize: 18, color: '#fff' },
  colorBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  colorBadgeText: { fontWeight: '700', fontSize: 14 },
  bottomBar: { position: 'absolute', bottom: 60, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40 },
  sideButton: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  sideButtonText: { fontSize: 28 },
  shutterOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30 },
  colorHint: { position: 'absolute', top: height * 0.2, left: 20, right: 20, height: height * 0.5, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed' },
});
