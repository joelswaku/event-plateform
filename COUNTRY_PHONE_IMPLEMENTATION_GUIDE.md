# Country & Phone Number Implementation Guide

## Overview
This guide covers the implementation of country selection with timezone detection and automatic phone code insertion across both mobile and web applications.

## What Was Implemented

### 1. Database Migration
**File**: `api/migrations/1780400000001_create-countries-table.js`

- Created `countries` table with:
  - Country codes (ISO 2-letter)
  - Country names
  - Phone codes (e.g., +1, +44)
  - Timezones (e.g., America/New_York)
  - Flag emojis for UI

- Contains 200+ countries with complete data
- Indexed by country code for fast lookups

**To run the migration**:
```bash
cd api
npm run migrate up
```

### 2. Shared Data Module
**File**: `shared/countries.ts`

A shared TypeScript module used by both mobile and web apps containing:

- `COUNTRIES` - Complete array of all countries
- `detectCountryFromTimezone()` - Auto-detects user's country from browser/device timezone
- `getSortedCountries()` - Returns countries alphabetically with detected country first
- `getCountryByCode()` - Lookup helper

### 3. Mobile App Components

#### CountrySelector
**File**: `eventapp-mobile/components/ui/CountrySelector.tsx`

Features:
- Modal-based country picker
- Search functionality
- Auto-detects user's country via timezone
- Shows detected country first with "Detected" badge
- Flag emojis for visual recognition

Usage:
```tsx
import { CountrySelector } from '@/components/ui/CountrySelector';

<CountrySelector
  value={form.country}  // Country code like 'US'
  onChange={(country) => setForm({ ...form, country: country.code })}
  placeholder="Select country"
/>
```

#### PhoneInput
**File**: `eventapp-mobile/components/ui/PhoneInput.tsx`

Features:
- Combined country code selector + phone number input
- Auto-detects user's country
- Only allows numeric input for phone number
- Automatically adds country code when country changes
- Returns full phone number with code

Usage:
```tsx
import { PhoneInput } from '@/components/ui/PhoneInput';

const [phone, setPhone] = useState('');
const [countryCode, setCountryCode] = useState('');

<PhoneInput
  value={phone}
  onChange={(fullPhone, countryCode) => {
    setPhone(fullPhone);
    setCountryCode(countryCode);
  }}
  placeholder="Phone number"
  error={errors.phone}
/>
```

### 4. Web App Components

#### CountrySelector
**File**: `web/src/components/ui/CountrySelector.tsx`

Same features as mobile but with web-optimized UI:
- Dropdown-based (not modal)
- Tailwind CSS styling
- Search functionality
- Timezone detection

Usage:
```tsx
import { CountrySelector } from '@/components/ui/CountrySelector';

<CountrySelector
  value={form.country}
  onChange={(country) => setForm({ ...form, country: country.code })}
  placeholder="Select country"
  error={errors.country}
/>
```

#### PhoneInput
**File**: `web/src/components/ui/PhoneInput.tsx`

Features:
- Inline country code selector + phone input
- Auto-detection
- Numeric-only phone input

Usage:
```tsx
import { PhoneInput } from '@/components/ui/PhoneInput';

<PhoneInput
  value={phone}
  onChange={(fullPhone, countryCode) => {
    setPhone(fullPhone);
    setCountryCode(countryCode);
  }}
  placeholder="Phone number"
  error={errors.phone}
/>
```

## Implementation Checklist

### For Each Form That Needs Country/Phone

#### Mobile App Forms
Replace old inputs with new components:

**Country Field**:
```tsx
// OLD:
<Input
  label="Country"
  value={form.country}
  onChangeText={t => setForm({...form, country: t})}
/>

// NEW:
<View>
  <Text style={styles.label}>Country</Text>
  <CountrySelector
    value={form.country}
    onChange={(country) => setForm({...form, country: country.code})}
  />
</View>
```

**Phone Field**:
```tsx
// OLD:
<Input
  label="Phone"
  value={form.phone}
  onChangeText={t => setForm({...form, phone: t})}
  keyboardType="phone-pad"
/>

// NEW:
<View>
  <Text style={styles.label}>Phone</Text>
  <PhoneInput
    value={form.phone}
    onChange={(phone, countryCode) => {
      setForm({...form, phone, country: countryCode});
    }}
  />
</View>
```

**Zip/Postal Code** (numeric only):
```tsx
// OLD:
<Input
  label="Zip Code"
  value={form.zip_code}
  onChangeText={t => setForm({...form, zip_code: t})}
/>

// NEW:
<Input
  label="Zip Code"
  value={form.zip_code}
  onChangeText={t => setForm({...form, zip_code: t.replace(/[^0-9]/g, '')})}
  keyboardType="numeric"
/>
```

#### Web App Forms

**Country Field**:
```tsx
// OLD:
<input
  type="text"
  value={form.country}
  onChange={(e) => setForm({...form, country: e.target.value})}
/>

// NEW:
<CountrySelector
  value={form.country}
  onChange={(country) => setForm({...form, country: country.code})}
/>
```

**Phone Field**:
```tsx
// OLD:
<input
  type="tel"
  value={form.phone}
  onChange={(e) => setForm({...form, phone: e.target.value})}
/>

// NEW:
<PhoneInput
  value={form.phone}
  onChange={(phone, countryCode) => {
    setForm({...form, phone, country: countryCode});
  }}
/>
```

**Zip/Postal Code**:
```tsx
// OLD:
<input
  type="text"
  value={form.zipCode}
  onChange={(e) => setForm({...form, zipCode: e.target.value})}
/>

// NEW:
<input
  type="text"
  value={form.zipCode}
  onChange={(e) => setForm({...form, zipCode: e.target.value.replace(/[^0-9]/g, '')})}
  inputMode="numeric"
  pattern="[0-9]*"
/>
```

## Forms That Need Updating

### Mobile App (`eventapp-mobile/app/`)
- ✅ `events/create.tsx` - Event creation form (COMPLETED)
- ⏳ `events/[id]/edit.tsx` - Event editing
- ⏳ `events/[id]/guests/contacts.tsx` - Guest contacts
- ⏳ `events/[id]/guests.tsx` - Guest list
- ⏳ `events/[id]/guests/[guestId].tsx` - Individual guest
- ⏳ `planner/[projectId].tsx` - Planner vendor contact
- ⏳ `planner/vendors/[projectId].tsx` - Vendor details
- ⏳ `super-admin/vendors.tsx` - Super admin vendor management
- ⏳ `components/tickets/PurchaseSheet.tsx` - Ticket purchase

### Web App (`web/src/app/`)
- ⏳ `(dashboard)/team-events/[id]/page.tsx` - Event management
- ⏳ Check for other forms with country/phone fields

## API Updates

The API already has the `zip_code` field added to events (migration `1777150878454_add-zip-code-to-events.js`).

### Recommended API Changes:
1. Update event creation/update endpoints to validate:
   - Country codes against the `countries` table
   - Zip codes as numeric-only
   - Phone numbers include country code

2. Add validation middleware:
```javascript
// Example validation
function validateCountryCode(code) {
  return db.query('SELECT 1 FROM countries WHERE code = $1', [code]);
}

function validateZipCode(zip) {
  return /^\d+$/.test(zip);
}

function validatePhoneWithCode(phone) {
  return /^\+\d+\d{6,15}$/.test(phone);
}
```

## Benefits

1. **Better UX**: Users don't have to type country names or guess formats
2. **Data Consistency**: All countries stored as ISO codes
3. **Auto Phone Codes**: Reduces errors in international phone numbers
4. **Timezone Detection**: Smart defaults based on user location
5. **Validation**: Numeric-only zip codes prevent invalid formats
6. **Searchable**: Users can search countries by name or code

## Testing Checklist

- [ ] Verify timezone detection works correctly
- [ ] Test country selector search functionality
- [ ] Confirm phone input only accepts numbers
- [ ] Check that country changes update phone code
- [ ] Validate zip code only accepts numbers
- [ ] Test on different timezones
- [ ] Verify mobile modal UI
- [ ] Verify web dropdown UI
- [ ] Test with existing data migration
- [ ] Confirm API saves country codes correctly

## Troubleshooting

### Timezone detection not working
- Check browser/device permissions
- Falls back to US if detection fails

### Countries not showing
- Ensure `shared/countries.ts` is properly imported
- Check TypeScript compilation

### Phone code not updating
- Verify `onChange` callback receives both `phone` and `countryCode`
- Check that state is being updated correctly

### Styling issues
- Mobile: Check that styles are imported
- Web: Verify Tailwind classes are working

## Next Steps

1. Run the database migration
2. Update remaining forms (use checklist above)
3. Test thoroughly
4. Update API validation
5. Consider adding country flags to existing data displays
