'use client';

/**
 * PhoneInput Component for Web App
 * Automatically adds country code when country is selected
 */

import React, { useState, useEffect, useMemo } from 'react';
import { COUNTRIES, getSortedCountries, getCountryByCode, detectCountryFromTimezone, type Country } from '@/lib/countries';

interface PhoneInputProps {
  value?: string; // Full phone number with country code
  onChange: (phone: string, countryCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Phone number',
  disabled,
  className = '',
  error
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
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
  }, [selectedCountry]);

  // Parse existing value
  useEffect(() => {
    if (value && !phoneNumber) {
      const matchedCountry = COUNTRIES.find(c => value.startsWith(c.phoneCode));
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhoneNumber(value.substring(matchedCountry.phoneCode.length));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value, phoneNumber]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    const fullPhone = country.phoneCode + phoneNumber;
    onChange(fullPhone, country.code);
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    if (selectedCountry) {
      const fullPhone = selectedCountry.phoneCode + cleaned;
      onChange(fullPhone, selectedCountry.code);
    }
  };

  const filteredCountries = useMemo(() => {
    if (!search) return sortedCountries;
    const query = search.toLowerCase();
    return sortedCountries.filter(
      c => c.name.toLowerCase().includes(query) || c.phoneCode.includes(search)
    );
  }, [search, sortedCountries]);

  return (
    <div className={`${className}`}>
      <div className={`
        flex items-center rounded-lg border overflow-hidden
        bg-gray-900/50 border-gray-700/50
        ${error ? 'border-red-500/50' : ''}
        ${disabled ? 'opacity-50' : ''}
      `}>
        {/* Country Code Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-3 border-r border-gray-700/50
              ${disabled ? 'cursor-not-allowed' : 'hover:bg-gray-800/50 cursor-pointer'}
              transition-colors
            `}
          >
            {selectedCountry && (
              <>
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-semibold text-white">{selectedCountry.phoneCode}</span>
              </>
            )}
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Country Dropdown */}
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div className="absolute z-50 mt-1 w-80 max-h-80 overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900 shadow-2xl left-0 top-full">
                {/* Search */}
                <div className="p-3 border-b border-gray-700/50">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search countries..."
                      className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Countries List */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No countries found</div>
                  ) : (
                    filteredCountries.map((country, index) => {
                      const isDetected = index === 0 && country.code === sortedCountries[0].code;
                      return (
                        <button
                          key={country.code}
                          onClick={() => handleCountryChange(country)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-gray-800/50
                            ${country.code === selectedCountry?.code ? 'bg-indigo-500/10' : 'hover:bg-gray-800/50'}
                            ${isDetected ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : ''}
                            transition-colors
                          `}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white">{country.name}</div>
                          </div>
                          <div className="text-sm font-semibold text-gray-400">{country.phoneCode}</div>
                          {country.code === selectedCountry?.code && (
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={15}
          className="flex-1 px-4 py-3 bg-transparent text-sm font-semibold text-white placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
