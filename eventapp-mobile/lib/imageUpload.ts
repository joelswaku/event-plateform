import api from '@/lib/api';

// expo-image-picker is optional — install with: npx expo install expo-image-picker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ImagePicker: any = null;
try { ImagePicker = require('expo-image-picker'); } catch { /* not installed */ }

export async function pickAndUploadImage(): Promise<string | null> {
  if (!ImagePicker) {
    console.warn('expo-image-picker not installed. Run: npx expo install expo-image-picker');
    return null;
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const form  = new FormData();
  form.append('file', { uri: asset.uri, type: 'image/jpeg', name: 'upload.jpg' } as unknown as Blob);

  try {
    const res = await api.post<{ data: { url: string } }>('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data?.url ?? null;
  } catch {
    return null;
  }
}
