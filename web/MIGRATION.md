# Shared Event Renderer — Migration Guide

## What changed

Before: Two separate rendering systems
- `EventPagePreview.jsx` → builder-only with inline renderers
- `SectionRendererPublic.jsx` + `sectionRegistry.js` → public-only components

After: ONE shared system
- `SharedEventRenderer.jsx` → single source of truth
- `sections/sectionRegistry.js` → single component map
- `sections/HeroSection.jsx` → shared hero
- `sections/SharedSections.jsx` → all other shared sections

---

## File structure (new files to create)

```
web/src/components/events/shared/
  ├── SharedEventRenderer.jsx         ← Core renderer (use in both builder + public)
  └── sections/
      ├── sectionRegistry.js          ← Section type → component map
      ├── HeroSection.jsx             ← Hero section
      └── SharedSections.jsx          ← All other sections (About, Story, Couple, etc.)
```

---

## How to migrate

### 1. Create the shared folder
Copy the 4 files above into `web/src/components/events/shared/`

### 2. Update the builder page
Replace `web/src/app/(dashboard)/events/[eventId]/builder/page.js` with the new version.

Key change — swap `EventPagePreview` for `SharedEventRenderer`:
```jsx
// OLD
import EventPagePreview from "@/components/events/builder/EventPagePreview";
<EventPagePreview eventId={eventId} sections={sections} onSelect={handleSectionSelect} />

// NEW
import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
<SharedEventRenderer
  event={builder.event}
  sections={builder.sections || []}
  isEditor={true}
  onSectionClick={handleSectionClick}
  onReorder={handleReorder}
  selectedSectionId={selectedSection?.id}
/>
```

### 3. Update the public page
Replace `web/src/app/e/[slug]/page.js` with the new version.

Key change:
```jsx
// OLD
import EventPublicRenderer from "@/components/events/public/EventPublicRenderer";
<EventPublicRenderer event={event} builder={builder} />

// NEW
import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
<SharedEventRenderer
  event={enrichedEvent}
  sections={sections}
  isEditor={false}
/>
```

### 4. Delete old files (no longer needed)
```
web/src/components/events/builder/EventPagePreview.jsx   ← DELETE
web/src/components/events/public/EventPublicRenderer.jsx  ← DELETE
web/src/components/events/public/SectionRendererPublic.jsx ← DELETE
web/src/components/events/public/sectionRegistry.js       ← DELETE (replaced)
web/src/components/events/public/sections/HeroPublic.jsx  ← DELETE (replaced)
web/src/components/events/public/sections/AboutPublic.jsx ← DELETE (replaced)
... (all sections in /public/sections/)
```

---

## SharedEventRenderer props

| Prop | Type | Description |
|------|------|-------------|
| `event` | object | Event data from API |
| `sections` | array | Section objects from builder API |
| `isEditor` | boolean | `true` in builder, `false` on public page |
| `onSectionClick` | function | Called when a section is clicked (editor only) |
| `onReorder` | function | Called after drag-drop reorder (editor only) |
| `selectedSectionId` | string | Highlights the selected section (editor only) |

---

## Adding a new section type

1. Create `web/src/components/events/shared/sections/MyNewSection.jsx`
2. Export it from `SharedSections.jsx` (or its own file)
3. Add to `sectionRegistry.js`:
   ```js
   MY_NEW_SECTION: MyNewSection,
   ```
4. Add to `SECTION_TEMPLATES` in `event-builder.service.js` (backend)

That's it — it automatically works in BOTH builder and public page.

---

## Architecture principle

```
Builder page (isEditor=true)
         ↓
SharedEventRenderer
         ↓
SECTION_REGISTRY → same components
         ↑
Public page (isEditor=false)
```

`isEditor` prop controls:
- Drag handle visibility
- Click-to-select overlays
- Section badge labels
- DnD context wrapping
- Visibility filtering (hidden sections shown in editor, hidden in public)
