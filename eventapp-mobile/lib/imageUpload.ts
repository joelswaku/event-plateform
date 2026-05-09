import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import api from '@/lib/api';

export async function pickAndUploadImage(eventId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Allow photo library access to upload images.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const form  = new FormData();
  form.append('file', {
    uri:  asset.uri,
    type: asset.mimeType ?? 'image/jpeg',
    name: asset.fileName  ?? 'upload.jpg',
  } as unknown as Blob);

  try {
    const res = await api.post<{ data: { cloudinary: { secure_url: string } } }>(
      `/upload-image/events/${eventId}/builder/upload-image`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data?.data?.cloudinary?.secure_url ?? null;
  } catch (err: any) {
    Alert.alert(
      'Upload failed',
      err?.response?.data?.message ?? 'Could not upload image. Please try again.',
    );
    return null;
  }
}
