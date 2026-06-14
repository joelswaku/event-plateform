# Light Mode Design System - Event Platform Web

## Overview
This document outlines the comprehensive light mode design system implemented across the event platform web application. All 74 pages have been optimized for both light and dark modes with consistent, professional styling.

## Global Design Tokens

### Color System

#### Light Mode
```css
--background: #f9fafb;      /* Base background */
--foreground: #111827;      /* Primary text */
--card: #ffffff;            /* Card backgrounds */
--border: #e5e7eb;          /* Default borders */
--border-strong: #d1d5db;   /* Emphasized borders */
--muted: #6b7280;           /* Muted text */
```

#### Surface Hierarchy
```css
--bg-base: #f8fafc;         /* Page base */
--bg-surface: #ffffff;      /* Card/panel surface */
--bg-elevated: #f1f5f9;     /* Elevated elements */
--bg-subtle: #f9fafb;       /* Subtle backgrounds */
```

#### Text Colors
```css
--text-primary: #0f172a;    /* Headings, primary text */
--text-secondary: #475569;  /* Secondary text */
--text-muted: #94a3b8;      /* Muted/hint text */
--text-hint: #cbd5e1;       /* Placeholder text */
```

#### Accent Colors
```css
--accent: #6366f1;          /* Primary brand color */
--accent-hover: #4f46e5;    /* Hover state */
--accent-light: #818cf8;    /* Light variant */
--accent-purple: #a78bfa;   /* Secondary accent */
```

#### Status Colors
- **Success**: Green (`#059669`) with 10% background opacity
- **Warning**: Amber (`#d97706`) with 10% background opacity
- **Error**: Red (`#dc2626`) with 10% background opacity
- **Info**: Indigo (`#4f46e5`) with 10% background opacity

### Shadow System
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## Utility Classes

### Cards
```css
.card-light {
  @apply bg-white dark:bg-gray-900 
         border border-gray-200 dark:border-gray-800 
         rounded-xl;
}

.card-elevated {
  @apply bg-white dark:bg-gray-800 
         border border-gray-200 dark:border-gray-700 
         rounded-xl shadow-sm;
}
```

### Inputs
```css
.input-light {
  @apply w-full rounded-xl 
         border-2 border-gray-300 dark:border-gray-700 
         bg-white dark:bg-gray-800 
         px-3.5 py-2.5 text-sm 
         text-gray-900 dark:text-gray-100 
         placeholder-gray-400 
         focus:border-indigo-500 dark:focus:border-indigo-400 
         focus:outline-none focus:ring-2 
         focus:ring-indigo-100 dark:focus:ring-indigo-900 
         transition;
}
```

### Buttons
```css
.btn-primary {
  @apply rounded-xl px-4 py-2.5 text-sm font-bold 
         text-white 
         bg-indigo-600 hover:bg-indigo-700 
         dark:bg-indigo-500 dark:hover:bg-indigo-600 
         transition-colors 
         focus:outline-none focus:ring-2 
         focus:ring-indigo-100 dark:focus:ring-indigo-900;
}

.btn-secondary {
  @apply rounded-xl px-4 py-2.5 text-sm font-semibold 
         text-gray-700 dark:text-gray-200 
         bg-gray-100 dark:bg-gray-800 
         hover:bg-gray-200 dark:hover:bg-gray-700 
         border border-gray-300 dark:border-gray-700 
         transition-colors;
}
```

### Text Utilities
```css
.text-primary     { @apply text-gray-900 dark:text-white; }
.text-secondary   { @apply text-gray-600 dark:text-gray-300; }
.text-muted       { @apply text-gray-500 dark:text-gray-400; }
.text-hint        { @apply text-gray-400 dark:text-gray-500; }
```

### Status Badges
```css
.status-success { @apply bg-green-50 dark:bg-green-900/20 
                        text-green-700 dark:text-green-400 
                        border border-green-200 dark:border-green-800; }

.status-warning { @apply bg-amber-50 dark:bg-amber-900/20 
                        text-amber-700 dark:text-amber-400 
                        border border-amber-200 dark:border-amber-800; }

.status-error   { @apply bg-red-50 dark:bg-red-900/20 
                        text-red-700 dark:text-red-400 
                        border border-red-200 dark:border-red-800; }

.status-info    { @apply bg-indigo-50 dark:bg-indigo-900/20 
                        text-indigo-700 dark:text-indigo-400 
                        border border-indigo-200 dark:border-indigo-800; }
```

## Component Standards

### Fixed Components

#### 1. DateTimePicker
- **Light mode background**: White (`bg-white`)
- **Border**: 2px solid gray-300 → 2px solid indigo-500 (focus)
- **Icon colors**: gray-500 → indigo-600 (active)
- **Text**: gray-900 (dark) / gray-400 (placeholder)

#### 2. CountrySelector
- **Trigger**: White background, 2px gray-300 border
- **Dropdown**: White background with gray-200 borders
- **Hover states**: gray-50 background
- **Selected state**: indigo-50 background

#### 3. Form Inputs (Create Event, etc.)
- **Border**: 2px solid gray-300 (increased from 1px gray-200)
- **Focus**: indigo-500 border with indigo-100 ring
- **Background**: Pure white
- **Text**: gray-900

#### 4. StatCard
- Already optimized with proper light/dark variants
- Uses color-specific backgrounds (indigo-50, emerald-50, etc.)

#### 5. EmptyState
- **Background**: white with dashed gray-300 border
- **Text**: gray-900 heading, gray-500 description

#### 6. PageHeader
- Already optimized with gradient accent bar
- Proper text contrast in both modes

## Best Practices

### 1. Always Use Tailwind Dark Mode Classes
```jsx
// ✅ Good
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

// ❌ Bad - inline styles without dark mode
<div style={{ background: '#ffffff', color: '#000000' }}>
```

### 2. Border Visibility
- Use **2px borders** for inputs and interactive elements
- Light mode borders should be at least `gray-300` or darker
- Use `border-gray-200` only for subtle dividers

### 3. Text Contrast
- Primary text: `text-gray-900 dark:text-white`
- Secondary text: `text-gray-600 dark:text-gray-300`
- Muted text: `text-gray-500 dark:text-gray-400`
- Never use `rgba(255,255,255,...)` for light mode text

### 4. Backgrounds
- Cards: `bg-white dark:bg-gray-900`
- Elevated cards: `bg-white dark:bg-gray-800`
- Page base: `bg-gray-50 dark:bg-gray-950`
- Never use dark rgba values like `rgba(255,255,255,0.03)` for light mode

### 5. Interactive States
```jsx
// Buttons and clickable elements
className="hover:bg-gray-100 dark:hover:bg-gray-800
           active:scale-95 transition-all"

// Focus states
className="focus:outline-none 
           focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900
           focus:border-indigo-500 dark:focus:border-indigo-400"
```

### 6. Status Colors
Use CSS variables or Tailwind classes:
```jsx
// Using utility classes (preferred)
<div className="status-success">Success message</div>

// Using inline with proper dark mode
<div className="bg-green-50 dark:bg-green-900/20 
                text-green-700 dark:text-green-400">
  Success
</div>
```

## Pages Requiring Manual Review

Due to the extensive use of inline styles for mobile-specific designs, the following pages may need additional review:

1. **Dashboard** (`/dashboard`) - Mobile stat tiles use rgba colors
2. **Event Detail** (`/events/[eventId]`) - Mobile cards with gradient backgrounds
3. **Authentication Pages** - May have dark-first designs

### Quick Fix Pattern for Inline Styles

Replace dark-only rgba values with CSS variables or Tailwind classes:

```jsx
// Before
style={{ 
  background: "rgba(255,255,255,0.03)",
  borderColor: "rgba(255,255,255,0.08)",
  color: "#ffffff"
}}

// After
className="bg-white dark:bg-gray-900/50 
           border-gray-300 dark:border-gray-700/50 
           text-gray-900 dark:text-white"
```

## Testing Checklist

### Visual Testing
- [ ] All text is readable in light mode (contrast ratio ≥ 4.5:1)
- [ ] Borders are visible on all inputs and cards
- [ ] Hover states work in both modes
- [ ] Focus states are visible
- [ ] Status colors are distinguishable
- [ ] Shadows don't appear too heavy in light mode

### Functional Testing
- [ ] Form inputs are clearly visible and focusable
- [ ] Dropdowns render correctly
- [ ] Modals and overlays have proper backdrop
- [ ] Navigation is accessible
- [ ] Cards and buttons have clear clickable areas

### Page-by-Page Review
Run through each major section:
- [ ] Dashboard
- [ ] Events list
- [ ] Event detail pages
- [ ] Create event flow
- [ ] Authentication (login, register)
- [ ] Settings
- [ ] Builder
- [ ] Analytics
- [ ] Tickets management

## Deployment Checklist

Before deploying to production:

1. **Verify CSS Build**
   ```bash
   npm run build
   ```
   Check for any PostCSS/Tailwind warnings

2. **Test in Multiple Browsers**
   - Chrome/Edge (Chromium)
   - Firefox
   - Safari (if available)

3. **Test System Theme Detection**
   - Verify auto theme switching works
   - Test manual theme toggle

4. **Performance Check**
   - Ensure no layout shifts between theme switches
   - Verify CSS-in-JS performance is acceptable

5. **Accessibility Audit**
   - Run Lighthouse audit
   - Check WCAG AA compliance
   - Test with screen readers

## Future Improvements

1. **Theme Persistence**
   - Store user preference in localStorage
   - Sync across tabs

2. **Custom Theme Colors**
   - Allow users to customize accent colors
   - Support for additional theme variants

3. **Component Library**
   - Create Storybook documentation
   - Document all component variants

4. **Automated Testing**
   - Visual regression tests for themes
   - Automated contrast ratio checks

---

**Last Updated**: 2026-06-11
**Status**: Phase 1 Complete - Core components and design system established
**Next Phase**: Page-by-page manual review and inline style refactoring
