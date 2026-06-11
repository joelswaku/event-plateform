/**
 * CountrySelector Component for Mobile App
 * Detects user's country via timezone and shows it first in the list
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { COUNTRIES, getSortedCountries, getCountryByCode, type Country } from '@/lib/countries';

interface CountrySelectorProps {
  value?: string; // Country code (e.g., 'US')
  onChange: (country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CountrySelector({ value, onChange, placeholder = 'Select country', disabled }: CountrySelectorProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const sortedCountries = useMemo(() => getSortedCountries(), []);
  const selectedCountry = value ? getCountryByCode(value) : null;

  const filteredCountries = useMemo(() => {
    if (!search) return sortedCountries;
    const query = search.toLowerCase();
    return sortedCountries.filter(
      c => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
    );
  }, [search, sortedCountries]);

  const handleSelect = (country: Country) => {
    onChange(country);
    setVisible(false);
    setSearch('');
  };

  return (
    <>
      <Pressable
        style={[s.trigger, disabled && s.triggerDisabled]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        {selectedCountry ? (
          <>
            <Text style={s.flag}>{selectedCountry.flag}</Text>
            <Text style={s.triggerText}>{selectedCountry.name}</Text>
          </>
        ) : (
          <Text style={s.placeholderText}>{placeholder}</Text>
        )}
        <Feather name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={s.backdrop} onPress={() => setVisible(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={s.modal}>
            <View style={s.header}>
              <Text style={s.title}>Select Country</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#fff" />
              </Pressable>
            </View>

            <View style={s.searchWrap}>
              <Feather name="search" size={16} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={s.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search countries..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search ? (
                <Pressable onPress={() => setSearch('')} hitSlop={10}>
                  <Feather name="x-circle" size={16} color="rgba(255,255,255,0.4)" />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={item => item.code}
              renderItem={({ item, index }) => {
                const isDetected = index === 0 && item.code === sortedCountries[0].code;
                return (
                  <Pressable
                    style={[
                      s.item,
                      item.code === value && s.itemSelected,
                      isDetected && s.itemDetected
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={s.flag}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.name}</Text>
                      <Text style={s.itemCode}>{item.phoneCode}</Text>
                    </View>
                    {item.code === value && <Feather name="check" size={18} color={Colors.accent.indigo} />}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={s.emptyText}>No countries found</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 11,
    paddingHorizontal: 14,
    height: 50,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  flag: {
    fontSize: 20,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  placeholderText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#0d0d1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  itemSelected: {
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  itemDetected: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  itemCode: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },

  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
});
