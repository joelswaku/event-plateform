import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, ScrollView, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const { width: SW } = Dimensions.get('window');

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const HOURS  = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINS   = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

interface Props {
  label:    string;
  value:    Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
}

export function DateTimePicker({ label, value, onChange, minDate }: Props) {
  const now = new Date();
  const [open,      setOpen]      = useState(false);
  const [viewDate,  setViewDate]  = useState(value ?? now);
  const [selected,  setSelected]  = useState(value ?? now);
  const [ampm,      setAmpm]      = useState<'AM'|'PM'>(value ? (value.getHours() >= 12 ? 'PM' : 'AM') : 'AM');
  const [hour,      setHour]      = useState(value ? String(value.getHours() % 12 || 12).padStart(2,'0') : '12');
  const [minute,    setMinute]    = useState(value ? String(Math.round(value.getMinutes()/5)*5).padStart(2,'0') : '00');

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build calendar grid
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectDay = (day: number) => {
    const d = new Date(year, month, day);
    setSelected(d);
  };

  const confirm = () => {
    const d = new Date(selected);
    let h = parseInt(hour, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    d.setHours(h, parseInt(minute, 10), 0, 0);
    onChange(d);
    setOpen(false);
  };

  const isToday  = (d: number) => {
    const t = new Date();
    return t.getDate() === d && t.getMonth() === month && t.getFullYear() === year;
  };
  const isSelected = (d: number) =>
    selected.getDate() === d && selected.getMonth() === month && selected.getFullYear() === year;
  const isPast = (d: number) => {
    if (!minDate) return false;
    const c = new Date(year, month, d);
    return c < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  };

  const formatted = value
    ? value.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Select date & time';

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <View style={styles.triggerLeft}>
          <View style={styles.triggerIcon}>
            <Feather name="calendar" size={15} color={Colors.accent.indigo} />
          </View>
          <View>
            <Text style={styles.triggerLabel}>{label}</Text>
            <Text style={[styles.triggerValue, !value && { color: Colors.text.subtle }]}>{formatted}</Text>
          </View>
        </View>
        <Feather name="chevron-down" size={16} color={Colors.text.subtle} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>

          {/* Handle */}
          <View style={styles.handle} />

          {/* Title */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Feather name="x" size={20} color={Colors.text.muted} />
            </Pressable>
          </View>

          {/* Month nav */}
          <View style={styles.monthNav}>
            <Pressable style={styles.monthBtn} onPress={prevMonth} hitSlop={8}>
              <Feather name="chevron-left" size={18} color="#fff" />
            </Pressable>
            <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
            <Pressable style={styles.monthBtn} onPress={nextMonth} hitSlop={8}>
              <Feather name="chevron-right" size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Day headers */}
          <View style={styles.dayRow}>
            {DAYS.map(d => (
              <Text key={d} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calGrid}>
            {cells.map((day, i) => {
              const sel  = day !== null && isSelected(day);
              const past = day !== null && isPast(day);
              const today = day !== null && isToday(day);
              return (
                <Pressable
                  key={i}
                  style={[
                    styles.calCell,
                    sel   && styles.calCellSelected,
                    today && !sel && styles.calCellToday,
                  ]}
                  onPress={() => day !== null && !past && selectDay(day)}
                  disabled={day === null || past}
                >
                  {day !== null && (
                    <Text style={[
                      styles.calCellText,
                      sel  && styles.calCellTextSelected,
                      past && styles.calCellTextPast,
                      today && !sel && { color: Colors.accent.indigo, fontWeight: '800' },
                    ]}>
                      {day}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Time picker */}
          <View style={styles.timeSection}>
            <Text style={styles.timeSectionLabel}>Time</Text>
            <View style={styles.timeRow}>

              {/* Hour */}
              <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false} snapToInterval={40} decelerationRate="fast">
                {HOURS.map(h => (
                  <Pressable
                    key={h}
                    style={[styles.timeCell, hour === h && styles.timeCellActive]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.timeCellText, hour === h && styles.timeCellTextActive]}>{h}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.timeSep}>:</Text>

              {/* Minute */}
              <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false} snapToInterval={40} decelerationRate="fast">
                {MINS.map(m => (
                  <Pressable
                    key={m}
                    style={[styles.timeCell, minute === m && styles.timeCellActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.timeCellText, minute === m && styles.timeCellTextActive]}>{m}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* AM/PM */}
              <View style={styles.ampmCol}>
                {(['AM','PM'] as const).map(p => (
                  <Pressable
                    key={p}
                    style={[styles.ampmBtn, ampm === p && styles.ampmBtnActive]}
                    onPress={() => setAmpm(p)}
                  >
                    <Text style={[styles.ampmText, ampm === p && styles.ampmTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </View>

            </View>
          </View>

          {/* Confirm */}
          <Pressable style={styles.confirmBtn} onPress={confirm}>
            <Text style={styles.confirmText}>Confirm</Text>
          </Pressable>

        </View>
      </Modal>
    </>
  );
}

const CELL_SIZE = Math.floor((SW - 48) / 7);

const styles = StyleSheet.create({
  trigger: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.input,
    borderRadius:   14,
    borderWidth:    1,
    borderColor:    Colors.border.DEFAULT,
    padding:        14,
  },
  triggerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  triggerIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: `${Colors.accent.indigo}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  triggerLabel: { fontSize: 10, color: Colors.text.subtle, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  triggerValue: { fontSize: 14, color: '#fff', fontWeight: '600', marginTop: 2 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.bg.sheet,
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border.strong,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },

  monthNav:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  monthLabel:{ fontSize: 15, fontWeight: '800', color: '#fff' },

  dayRow:   { flexDirection: 'row', marginBottom: 6 },
  dayHeader:{ width: CELL_SIZE, textAlign: 'center', fontSize: 10, fontWeight: '800', color: Colors.text.subtle, textTransform: 'uppercase' },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  calCell: {
    width: CELL_SIZE, height: CELL_SIZE,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: CELL_SIZE / 2,
  },
  calCellSelected: { backgroundColor: Colors.accent.indigo },
  calCellToday:    { borderWidth: 1, borderColor: Colors.accent.indigo },
  calCellText:     { fontSize: 13, fontWeight: '600', color: '#fff' },
  calCellTextSelected: { color: '#fff', fontWeight: '900' },
  calCellTextPast:     { color: Colors.text.subtle },

  timeSection:      { marginBottom: 20 },
  timeSectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.text.subtle, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  timeRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeSep:  { fontSize: 22, fontWeight: '900', color: Colors.text.muted, marginBottom: 4 },
  timeScroll: { height: 120, flex: 1 },
  timeCell: {
    height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  timeCellActive:     { backgroundColor: `${Colors.accent.indigo}20`, borderWidth: 1, borderColor: `${Colors.accent.indigo}40` },
  timeCellText:       { fontSize: 18, fontWeight: '600', color: Colors.text.muted },
  timeCellTextActive: { color: Colors.accent.indigo, fontWeight: '900' },

  ampmCol: { gap: 8 },
  ampmBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT,
  },
  ampmBtnActive:  { backgroundColor: `${Colors.accent.indigo}20`, borderColor: Colors.accent.indigo },
  ampmText:       { fontSize: 13, fontWeight: '700', color: Colors.text.muted },
  ampmTextActive: { color: Colors.accent.indigo },

  confirmBtn: {
    backgroundColor: Colors.accent.indigo,
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
