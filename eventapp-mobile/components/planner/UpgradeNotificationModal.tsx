import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

interface UpgradeNotificationModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function UpgradeNotificationModal({ isOpen, onDismiss }: UpgradeNotificationModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onDismiss();
    router.push('/profile/billing?plan=pro');
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={s.overlay} onPress={onDismiss}>
        <Pressable style={s.modal} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <Pressable onPress={onDismiss} style={s.closeBtn}>
            <Feather name="x" size={20} color="rgba(255,255,255,0.5)" />
          </Pressable>

          {/* Icon */}
          <View style={s.iconContainer}>
            <View style={s.iconCircle}>
              <Feather name="award" size={32} color="#fff" />
            </View>
          </View>

          {/* Title */}
          <Text style={s.title}>Upgrade to Pro for Full Planner Access</Text>

          {/* Description */}
          <Text style={s.description}>
            You're currently testing our planner features. Upgrade to Pro to unlock unlimited planner projects, team members, and advanced AI features.
          </Text>

          {/* Benefits */}
          <View style={s.benefits}>
            {[
              { icon: 'zap', text: 'Unlimited planner projects' },
              { icon: 'trending-up', text: 'Advanced AI task generation' },
              { icon: 'users', text: 'Unlimited team collaboration' },
            ].map((item, index) => (
              <View key={index} style={s.benefitRow}>
                <View style={s.benefitIcon}>
                  <Feather name={item.icon as any} size={14} color="#f59e0b" />
                </View>
                <Text style={s.benefitText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <Pressable onPress={handleUpgrade} style={s.upgradeBtn}>
              <Feather name="award" size={16} color="#fff" />
              <Text style={s.upgradeBtnText}>Upgrade to Pro</Text>
            </Pressable>

            <Pressable onPress={onDismiss} style={s.continueBtn}>
              <Text style={s.continueBtnText}>Continue with Current Plan</Text>
            </Pressable>
          </View>

          {/* Fine print */}
          <Text style={s.finePrint}>
            No payment required to continue using free features
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#14141f',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  benefits: {
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    gap: 10,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  continueBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  finePrint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 16,
  },
});
