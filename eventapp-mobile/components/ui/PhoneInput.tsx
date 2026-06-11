/**
 * PhoneInput Component for Mobile App
 * Automatically adds country code when country is selected
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Modal, FlatList, TextInput as RNTextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { COUNTRIES, getSortedCountries, getCountryByCode, detectCountryFromTimezone, type Country } from '@/lib/countries';

interface PhoneInputProps {
  value?: string; // Full phone number with country code
  onChange: (phone: string, countryCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function PhoneInput({ value, onChange, placeholder = 'Phone number', disabled, error }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const sortedCountries = getSortedCountries();

  // Initialize with detected country
  useEffect(() => {
    if (!selectedCountry) {
      const detectedCode = detectCountryFromTimezone();
      const country = detectedCode ? getCountryByCode(detectedCode) : getCountryByCode('US');
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, []);

  // Parse existing value
  useEffect(() => {
    if (value && !phoneNumber) {
      // Try to extract country code from value
      const matchedCountry = COUNTRIES.find(c => value.startsWith(c.phoneCode));
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhoneNumber(value.substring(matchedCountry.phoneCode.length));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setSearch('');
    // Update full phone number
    const fullPhone = country.phoneCode + phoneNumber;
    onChange(fullPhone, country.code);
  };

  const handlePhoneChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    if (selectedCountry) {
      const fullPhone = selectedCountry.phoneCode + cleaned;
      onChange(fullPhone, selectedCountry.code);
    }
  };

  const filteredCountries = search
    ? sortedCountries.filter(
        c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phoneCode.includes(search)
      )
    : sortedCountries;

  return (
    <View>
      <View style={[s.container, error && s.containerError, disabled && s.containerDisabled]}>
        {/* Country Code Selector */}
        <Pressable
          style={s.countryButton}
          onPress={() => !disabled && setModalVisible(true)}
          disabled={disabled}
        >
          {selectedCountry && (
            <>
              <Text style={s.flag}>{selectedCountry.flag}</Text>
              <Text style={s.phoneCode}>{selectedCountry.phoneCode}</Text>
            </>
          )}
          <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.4)" />
        </Pressable>

        {/* Phone Number Input */}
        <TextInput
          style={s.input}
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="phone-pad"
          editable={!disabled}
          maxLength={15}
        />
      </View>

      {error && <Text style={s.errorText}>{error}</Text>}

      {/* Country Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={s.backdrop} onPress={() => setModalVisible(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={s.modal}>
            <View style={s.header}>
              <Text style={s.title}>Select Country Code</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
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
                      item.code === selectedCountry?.code && s.itemSelected,
                      isDetected && s.itemDetected
                    ]}
                    onPress={() => handleCountryChange(item)}
                  >
                    <Text style={s.flag}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.name}</Text>
                    </View>
                    <Text style={s.itemPhoneCode}>{item.phoneCode}</Text>
                    {item.code === selectedCountry?.code && <Feather name="check" size={18} color={Colors.accent.indigo} />}
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
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 11,
    height: 50,
    overflow: 'hidden',
  },
  containerError: {
    borderColor: 'rgba(239,68,68,0.5)',
  },
  containerDisabled: {
    opacity: 0.5,
  },

  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.10)',
  },
  flag: {
    fontSize: 20,
  },
  phoneCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 14,
  },

  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    marginLeft: 4,
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
  itemPhoneCode: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginRight: 8,
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
