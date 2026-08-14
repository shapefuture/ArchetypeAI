# Quick Integration Guide
## Storybook UI Elements - Where to Use Each Component

---

## COMPONENT LOCATIONS IN APP.COMPONENT.HTML

### 1. Search Box (E8)
**Location:** Lines 202-229
**Current Implementation:** Generic input with Tailwind classes
**Replace With:**
```html
<app-search-box
  [placeholder]="translationService.t('searchPlaceholder', 'universe')"
  [value]="searchQuery()"
  (searchChange)="searchQuery.set($event)">
</app-search-box>
```

---

### 2. Cluster Filter Pills (E9)
**Location:** Lines 289-291 (within filter panel)
**Current Implementation:** Buttons with Tailwind classes
**Replace With:**
```html
@for(cluster of clusters; track cluster.id) {
  <app-cluster-badge
    [id]="cluster.id"
    [label]="translationService.t(cluster.id, 'universe.clusterNames')"
    [icon]="getClusterIcon(cluster.id)"
    [color]="getClusterColor(cluster.id)"
    [active]="activeClusterFilters().has(cluster.id)"
    (toggle)="toggleClusterFilter(cluster.id)"
    (view)="viewClusterConstellation(cluster.id)">
  </app-cluster-badge>
}
```

---

### 3. Constellation View Button (E10)
**Location:** Lines 390-395 (archetype HUD close button area)
**Current Implementation:** Generic SVG button
**Replace With:**
```html
<app-constellation-view-button
  (clicked)="viewConstellationMode()">
</app-constellation-view-button>
```

---

### 4. Full Universe Button (E11)
**Location:** Lines 195-198 (when viewing personal constellation)
**Current Implementation:**
```html
<button (click)="enterUniverse()" class="bg-teal-500/20 hover:bg-teal-500/30">
  View Full Universe
</button>
```
**Replace With:**
```html
<app-full-universe-button (clicked)="enterUniverse()">
  View Full Universe
</app-full-universe-button>
```

---

### 5. Language Toggle (E12)
**Location:** Lines 598-600 (bottom right UI bar)
**Current Implementation:**
```html
<button (click)="toggleLanguage()" class="hover:bg-black/5">
  {{ translationService.getLanguage() }}
</button>
```
**Replace With:**
```html
<app-language-toggle
  [currentLanguage]="translationService.getLanguage()"
  (clicked)="toggleLanguage()">
</app-language-toggle>
```

---

### 6. Help Panel (E13)
**Location:** Lines 614-700+ (help modal)
**Current Implementation:** Generic modal with Tailwind
**Replace With:**
```html
<app-help-modal
  [isOpen]="isHelpPanelOpen()"
  [title]="translationService.t('help', 'universe')"
  [description]="translationService.t('helpDescription', 'universe')"
  [items]="helpItems"
  [footer]="translationService.t('helpFooter', 'universe')"
  (close)="toggleHelpPanel()">
</app-help-modal>
```

**Help Items Array:**
```typescript
helpItems = [
  {
    title: 'Navigating the Universe',
    description: 'Click and drag to rotate. Scroll to zoom. Click on archetypes to reveal their patterns.'
  },
  {
    title: 'Personal Constellation',
    description: 'After the assessment, view your unique archetypal pattern in 3D space.'
  },
  {
    title: 'Cluster Filters',
    description: 'Filter archetypes by their dimensional clusters to explore patterns.'
  }
];
```

---

### 7. Creation Progress (E14)
**Location:** Lines 153-160 (assessment results loading)
**Current Implementation:** Generic SVG spinner
**Replace With:**
```html
<app-creation-progress
  [message]="translationService.t('analyzing', 'assessment.results')">
</app-creation-progress>
```

---

### 8. Back Button (E15)
**Multiple Locations:**
- Line 84-87 (assessment screen back to menu)
- Line 189-192 (universe screen back to menu)
- Any other "back" navigation

**Current Implementation:**
```html
<button (click)="goToIntro()" class="text-neutral-500 hover:text-neutral-800">
  <svg><!-- arrow --></svg>
  Back
</button>
```

**Replace With:**
```html
<app-back-button
  [label]="translationService.t('backToMenu', 'universe')"
  (clicked)="goToIntro()">
</app-back-button>
```

---

### 9. Progress Bar (E16)
**Location:** Lines 89-92 (assessment progress)
**Current Implementation:**
```html
<div class="w-full bg-neutral-200 rounded-full h-2.5">
  <div class="bg-teal-500 h-2.5 rounded-full" [style.width.%]="assessmentProgress()"></div>
</div>
```

**Replace With:**
```html
<app-storybook-progress
  [progress]="assessmentProgress()"
  [showLabel]="true"
  [sectionLabel]="currentQuestion()?.section"
  [sectionIcon]="getSectionIcon(currentQuestion()?.section)">
</app-storybook-progress>
```

**Section Icon Helper:**
```typescript
getSectionIcon(section?: string): string {
  const icons: Record<string, string> = {
    'section1': '🌟',
    'section2': '🔮',
    'section3': '🎭',
    // ... etc
  };
  return section ? icons[section] || '❓' : '';
}
```

---

## IMPORT STATEMENTS

Add to `app.component.ts`:

```typescript
import { SearchBoxComponent } from './shared/components/search-box/search-box.component';
import { ClusterBadgeComponent } from './shared/components/cluster-badge/cluster-badge.component';
import { ConstellationViewButtonComponent } from './shared/components/constellation-view-button/constellation-view-button.component';
import { FullUniverseButtonComponent } from './shared/components/full-universe-button/full-universe-button.component';
import { LanguageToggleComponent } from './shared/components/language-toggle/language-toggle.component';
import { HelpModalComponent } from './shared/components/help-modal/help-modal.component';
import { CreationProgressComponent } from './shared/components/creation-progress/creation-progress.component';
import { BackButtonComponent } from './shared/components/back-button/back-button.component';
import { StorybookProgressComponent } from './shared/components/storybook-progress/storybook-progress.component';
```

---

## MIGRATION PRIORITY

### Phase 1: Quick Wins (High Impact, Low Effort)
1. ✅ Language Toggle (E12) - 1 location
2. ✅ Back Button (E15) - 3 locations
3. ✅ Creation Progress (E14) - 1 location

### Phase 2: Medium Effort
4. ✅ Full Universe Button (E11) - 1 location
5. ✅ Constellation View Button (E10) - 1 location
6. ✅ Progress Bar (E16) - 1 location

### Phase 3: Requires Data Binding
7. ✅ Search Box (E8) - 1 location (simple)
8. ✅ Cluster Filter Pills (E9) - 1 location (loop binding)
9. ✅ Help Panel (E13) - 1 location (requires items array)

---

## BEFORE/AFTER COMPARISON

### Before:
```html
<button class="bg-neutral-50/60 hover:bg-neutral-50/80 backdrop-blur-lg border border-black/5">
  <svg><!-- generic icon --></svg>
  Generic Text
</button>
```

### After:
```html
<app-[component-name]
  [input]="value"
  (output)="handler()">
  Content
</app-[component-name]>
```

---

## TESTING CHECKLIST

After integration, verify:
- [ ] Visual appearance matches storybook aesthetic
- [ ] All hover effects work smoothly
- [ ] Click handlers trigger correct actions
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen readers announce buttons correctly
- [ ] Reduced motion preference is respected
- [ ] Mobile responsive (640px breakpoint)
- [ ] No console errors
- [ ] All animations are smooth (60fps)

---

## TROUBLESHOOTING

### Issue: Component not rendering
**Solution:** Ensure standalone imports are added to parent component

### Issue: Styles not applying
**Solution:** Verify design-system.css is imported in styles array

### Issue: Animations not smooth
**Solution:** Check GPU acceleration, add `will-change: transform`

### Issue: Colors not displaying
**Solution:** Verify CSS custom properties are defined in :root

---

## BENEFITS OF MIGRATION

1. **Consistency:** All UI elements follow same design system
2. **Maintainability:** Centralized component logic and styling
3. **Accessibility:** Built-in ARIA labels and keyboard support
4. **Performance:** Optimized animations with CSS
5. **Testability:** Each component has unit tests
6. **Reusability:** Components can be used across app
7. **Aesthetics:** Professional storybook hand-drawn look

---

**Status: Ready for Integration 🚀**
