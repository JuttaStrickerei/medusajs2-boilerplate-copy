# Design Tokens

## Base System
- Tailwind CSS v3 + @medusajs/ui-preset (DO NOT REMOVE)
- Dark mode: `darkMode: "class"`
- Font: Inter (system fallback)

## Breakpoints
| Name | Width |
|------|-------|
| 2xsmall | 320px |
| xsmall | 512px |
| small | 640px |
| medium | 768px |
| large | 1024px |
| xlarge | 1280px |
| 2xlarge | 1536px |

## MedusaJS UI Colors
Use default zinc palette from @medusajs/ui-preset for core UI.

## Brand Extension: Strickerei Jutta
Stone palette (warm grays) - ADD via theme.extend:
```
stone-50:  #fafaf9  - Page bg
stone-200: #e7e5e4  - Borders
stone-600: #57534e  - Body text
stone-800: #292524  - Primary
```

Typography extension:
- `font-serif`: Playfair Display (headings, brand)
- `font-sans`: Inter (body, UI)

## Custom Classes (globals.css) ✅ IMPLEMENTED
- `.nav-link` - Underline animation (used in navigation)
- `.hover-lift` - Card hover: translateY(-2px) + shadow (used in ProductPreview)
- `.fade-in` - Scroll animation with .stagger-1/2/3/4 variants
- `.text-shadow` - Subtle shadow for hero text

## Status
✅ Phase 1 Complete: Stone palette + Playfair Display added
✅ Phase 2 Complete: Navigation updated with brand styling
✅ Phase 3 Complete: Product cards use brand design

## Rule
EXTEND @medusajs/ui-preset, never replace it.
