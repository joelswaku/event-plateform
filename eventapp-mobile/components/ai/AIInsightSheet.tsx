import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Insight {
  type: 'warning' | 'success' | 'info' | 'action';
  message: string;
  count?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  insights?: Insight[];
  onApply?: (data: any) => void;
  result?: any;
}

const TYPE_META = {
  warning: { icon: 'alert-triangle' as const, color: '#f59e0b' },
  success: { icon: 'check-circle'  as const, color: '#10b981' },
  info:    { icon: 'info'          as const, color: '#6366f1' },
  action:  { icon: 'zap'           as const, color: '#818cf8' },
};

export default function AIInsightSheet({ open, onClose, title, insights = [], onApply, result }: Props) {
  return (
    <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Feather name="zap" size={16} color={Colors.accent.indigo} />
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={18} color={Colors.text.subtle} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {insights.map((ins, i) => {
              const meta = TYPE_META[ins.type] ?? TYPE_META.info;
              return (
                <View key={i} style={[styles.insightRow, { borderLeftColor: meta.color }]}>
                  <Feather name={meta.icon} size={15} color={meta.color} />
                  <Text style={styles.insightText}>{ins.message}</Text>
                  {ins.count != null && (
                    <View style={[styles.badge, { backgroundColor: meta.color + '22' }]}>
                      <Text style={[styles.badgeText, { color: meta.color }]}>{ins.count}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {onApply && result && (
            <TouchableOpacity style={styles.applyBtn} onPress={() => onApply(result)}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.bg.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border.DEFAULT },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text.primary },
  body: { paddingHorizontal: 20, paddingTop: 12 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12 },
  insightText: { flex: 1, fontSize: 13, color: Colors.text.muted, lineHeight: 18 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  applyBtn: { marginHorizontal: 20, marginTop: 12, backgroundColor: Colors.accent.indigo, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
