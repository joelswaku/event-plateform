/**
 * ConfirmModal — production-ready replacement for Alert.alert()
 *
 * Usage:
 *   const { confirm, confirmProps } = useConfirm();
 *   const { info, infoProps }       = useInfo();
 *
 *   // Destructive confirmation:
 *   confirm({
 *     title: 'Remove Admin',
 *     message: 'Remove this person from the event team?',
 *     confirmLabel: 'Remove',
 *     variant: 'danger',
 *     onConfirm: () => removeMember(id),
 *   });
 *
 *   // Info / success / error:
 *   info({ title: 'Saved!', message: 'Profile updated.', variant: 'success' });
 *
 *   // In JSX:
 *   <ConfirmModal {...confirmProps} />
 *   <InfoModal    {...infoProps}    />
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal,
  ActivityIndicator, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

/* ── Types ──────────────────────────────────────────────────────── */
export type ModalVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmConfig {
  title:          string;
  /** Body text — also accepted as `description` for backward compat */
  message?:       string;
  description?:   string;          // alias for message
  /** Button label — also accepted as `confirmText` */
  confirmLabel?:  string;
  confirmText?:   string;          // alias for confirmLabel
  cancelLabel?:   string;
  cancelText?:    string;          // alias for cancelLabel
  variant?:       ModalVariant;
  onConfirm:      () => void | Promise<void>;
  onCancel?:      () => void;
}
export interface ConfirmModalProps extends ConfirmConfig {
  /** Also accepted as `open` for backward compat */
  visible?: boolean;
  open?:    boolean;               // alias for visible
  onClose?: () => void;
}

export interface InfoConfig {
  title:    string;
  message?: string;
  variant?: ModalVariant;
  label?:   string;
}
export interface InfoModalProps extends InfoConfig {
  visible?: boolean;
  open?:    boolean;
  onClose?: () => void;
}

/* ── Variant tokens ─────────────────────────────────────────────── */
const V: Record<ModalVariant, { color: string; bg: string; border: string; icon: keyof typeof Feather.glyphMap; barColor: string }> = {
  danger:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)',   icon: 'trash-2',       barColor: '#ef4444' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  icon: 'alert-triangle', barColor: '#f59e0b' },
  info:    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.28)',  icon: 'info',          barColor: '#6366f1' },
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.28)',  icon: 'check-circle',  barColor: '#10b981' },
};

/* ── Backdrop + Card shared wrapper ─────────────────────────────── */
function ModalWrapper({ visible, onClose, children }: { visible: boolean; onClose?: () => void; children: React.ReactNode }) {
  const handleClose = onClose ?? (() => {});
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <Pressable style={s.backdrop} onPress={handleClose}>
        <Pressable onPress={e => e.stopPropagation()} style={s.card}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── ConfirmModal ────────────────────────────────────────────────── */
export function ConfirmModal(props: ConfirmModalProps) {
  // Resolve aliases so callers can use either naming convention
  const visible      = !!(props.visible ?? props.open);
  const onClose      = props.onClose ?? (() => {}); // Defensive: provide noop default
  const title        = props.title;
  const message      = props.message ?? props.description;
  const confirmLabel = props.confirmLabel ?? props.confirmText ?? 'Confirm';
  const cancelLabel  = props.cancelLabel  ?? props.cancelText  ?? 'Cancel';
  const variant      = props.variant ?? 'danger';
  const onConfirm    = props.onConfirm;
  const onCancel     = props.onCancel;

  const [loading, setLoading] = useState(false);
  const v = V[variant] ?? V['danger']; // fallback so unknown variants never crash

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); } catch { /* errors handled by caller */ }
    finally { setLoading(false); }
    onClose();
  };

  const handleCancel = () => { onCancel?.(); onClose(); };

  return (
    <ModalWrapper visible={visible} onClose={handleCancel}>
      <View style={[s.accentBar, { backgroundColor: v.barColor }]} />
      <View style={[s.iconWrap, { backgroundColor: v.bg, borderColor: v.border }]}>
        <Feather name={v.icon} size={22} color={v.color} />
      </View>
      <Text style={s.title}>{title}</Text>
      {message ? <Text style={s.msg}>{message}</Text> : null}
      <View style={s.btnRow}>
        <Pressable style={s.cancelBtn} onPress={handleCancel} disabled={loading}>
          <Text style={s.cancelTxt}>{cancelLabel}</Text>
        </Pressable>
        <Pressable
          style={[s.confirmBtn, { backgroundColor: v.color }, loading && s.btnLoading]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.confirmTxt}>{confirmLabel}</Text>}
        </Pressable>
      </View>
    </ModalWrapper>
  );
}

/* ── InfoModal — for success / error / info / permission msgs ─────── */
export function InfoModal(props: InfoModalProps) {
  const visible = !!(props.visible ?? props.open);
  const onClose = props.onClose ?? (() => {}); // Defensive: provide noop default
  const { title, message, variant = 'info', label = 'OK' } = props;
  const v = V[variant];
  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={[s.accentBar, { backgroundColor: v.barColor }]} />
      <View style={[s.iconWrap, { backgroundColor: v.bg, borderColor: v.border }]}>
        <Feather name={v.icon} size={22} color={v.color} />
      </View>
      <Text style={s.title}>{title}</Text>
      {message ? <Text style={s.msg}>{message}</Text> : null}
      <Pressable style={[s.confirmBtn, { backgroundColor: v.color, width: '100%', marginTop: 4 }]} onPress={onClose}>
        <Text style={s.confirmTxt}>{label}</Text>
      </Pressable>
    </ModalWrapper>
  );
}

/* ── useConfirm hook ─────────────────────────────────────────────── */
export function useConfirm() {
  const [visible, setVisible] = useState(false);
  const [cfg,     setCfg]     = useState<ConfirmConfig | null>(null);

  const confirm = useCallback((config: ConfirmConfig) => {
    setCfg(config);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setCfg(null), 350);
  }, []);

  const confirmProps: ConfirmModalProps = {
    visible,
    onClose:      close,
    title:        cfg?.title        ?? '',
    message:      cfg?.message,
    confirmLabel: cfg?.confirmLabel,
    cancelLabel:  cfg?.cancelLabel,
    variant:      cfg?.variant,
    onConfirm:    cfg?.onConfirm    ?? (() => {}),
    onCancel:     cfg?.onCancel,
  };

  return { confirm, confirmProps };
}

/* ── useInfo hook ─────────────────────────────────────────────────── */
export function useInfo() {
  const [visible, setVisible] = useState(false);
  const [cfg,     setCfg]     = useState<InfoConfig | null>(null);

  const info = useCallback((config: InfoConfig) => {
    setCfg(config);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setCfg(null), 350);
  }, []);

  const infoProps: InfoModalProps = {
    visible,
    onClose:  close,
    title:    cfg?.title   ?? '',
    message:  cfg?.message,
    variant:  cfg?.variant,
    label:    cfg?.label,
  };

  return { info, infoProps };
}

/* ── Styles ──────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0d0d1a',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.60,
    shadowRadius: 40,
    elevation: 24,
  },
  accentBar: { width: '100%', height: 3, marginBottom: 24 },
  iconWrap: {
    width: 54, height: 54, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: {
    fontSize: 17, fontWeight: '900', color: '#fff',
    textAlign: 'center', letterSpacing: -0.3, marginBottom: 8,
  },
  msg: {
    fontSize: 13, color: 'rgba(255,255,255,0.50)',
    textAlign: 'center', lineHeight: 20, marginBottom: 22,
  },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  cancelTxt:  { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  confirmBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmTxt: { fontSize: 14, fontWeight: '900', color: '#fff' },
  btnLoading: { opacity: 0.70 },
});
