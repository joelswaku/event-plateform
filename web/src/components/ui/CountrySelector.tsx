'use client';

/**
 * CountrySelector Component for Web App
 * Detects user's country via timezone and shows it first in the list
 */

import React, { useState, useMemo } from 'react';
import { COUNTRIES, getSortedCountries, getCountryByCode, type Country } from '@/lib/countries';

interface CountrySelectorProps {
  value?: string; // Country code (e.g., 'US')
  onChange: (country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function CountrySelector({
  value,
  onChange,
  placeholder = 'Select country',
  disabled,
  className = '',
  error
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-lg border
          bg-gray-900/50 border-gray-700/50
          ${error ? 'border-red-500/50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600 cursor-pointer'}
          transition-colors
        `}
      >
        {selectedCountry ? (
          <>
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="flex-1 text-left text-sm font-semibold text-white">{selectedCountry.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-sm text-gray-400">{placeholder}</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute z-50 mt-2 w-full max-h-80 overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900 shadow-2xl">
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
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Countries List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country, index) => {
                  const isDetected = index === 0 && country.code === sortedCountries[0].code;
                  return (
                    <button
                      key={country.code}
                      onClick={() => handleSelect(country)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-800/50
                        ${country.code === value ? 'bg-indigo-500/10' : 'hover:bg-gray-800/50'}
                        ${isDetected ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : ''}
                        transition-colors
                      `}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{country.name}</div>
                        <div className="text-xs text-gray-400">{country.phoneCode}</div>
                      </div>
                      {country.code === value && (
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  );
}
