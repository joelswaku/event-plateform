import * as Haptics from 'expo-haptics';
import { ScanResultType } from '@/types';

export function useHaptics() {
  const light   = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const medium  = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const heavy   = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const warning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  const error   = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

  const triple = async () => {
    await error();
    await new Promise(r => setTimeout(r, 150));
    await error();
    await new Promise(r => setTimeout(r, 150));
    await error();
  };

  const forScan = async (type: ScanResultType) => {
    switch (type) {
      case 'SUCCESS':   return medium();
      case 'DUPLICATE': return heavy();
      case 'INVALID':
      case 'REVOKED':   return triple();
      case 'QUEUED':    return light();
    }
  };

  return { light, medium, heavy, success, warning, error, triple, forScan };
}
