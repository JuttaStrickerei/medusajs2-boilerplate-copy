# Style Guide & Token System

## Styling Stack

### Primary Styling Approach
**Tailwind CSS v3** - Utility-first CSS framework
- Configured in `storefront/tailwind.config.js`
- Uses `@medusajs/ui-preset` for consistent MedusaJS component styling
- Custom theme extensions for project-specific design tokens

### UI Component Libraries
- **`@medusajs/ui`** (preview) - Pre-built components based on Radix UI primitives
  - Form controls, buttons, dropdowns, modals, etc.
  - Designed specifically for e-commerce use cases
- **`@headlessui/react`** v1.6.1 - Unstyled, accessible UI components
  - Use when you need more control than MedusaJS UI provides
- **Lucide React** - Icon library (referenced via MedusaJS UI)

### Tailwind Plugins & Extensions
- **`tailwindcss-radix`** v2.8.0 - Utilities for styling Radix UI components
  - Adds data-state and animation utilities for Radix primitives
- **PostCSS** + **Autoprefixer** - CSS processing and vendor prefixing

### Important: NO CSS Modules or styled-components
- This project does **NOT** use CSS Modules (`*.module.css`)
- This project does **NOT** use styled-components or CSS-in-JS
- **Always use Tailwind utility classes** for styling

### Dark Mode
- Configured with `darkMode: "class"` strategy
- Toggle dark mode by adding/removing `dark` class to root element

### Custom Design Tokens (Tailwind Config)
All custom tokens are defined in `storefront/tailwind.config.js`:
- **Colors**: Extended `grey` palette (0-90 scale)
- **Border Radius**: `soft`, `base`, `rounded`, `large`, `circle`
- **Breakpoints**: `2xsmall` (320px) → `2xlarge` (1920px)
- **Animations**: Custom keyframes for fading, sliding, accordion motions
- **Font**: Inter (system fallback to sans-serif)

## Typography
**Font Family**: Inter (sans-serif) or system-ui.
* **Headings**: `tracking-tight`, `font-semibold`, `text-zinc-900`.
* **Body**: `text-zinc-500` for secondary text, `text-zinc-900` for primary.
* **Small**: `text-xs` is allowed for metadata, but contrast must remain accessible (WCAG AA).

## Color Palette (Tailwind)
* **Primary**: Zinc 900 (Background), White (Foreground).
* **Accent**: Blue 600 (Actionable elements).
* **Destructive**: Red 500.
* **Borders**: Zinc 200 (Light mode).

## Spacing System
Everything follows the 4px grid.
* `gap-2` (8px): Tight grouping (icon + text).
* `gap-4` (16px): Default component spacing.
* `gap-8` (32px): Section separation.
* `p-6` (24px): Standard card padding.

## Component Library (Radix + Medusa UI)
We use `@medusajs/ui` as the base.
* **Buttons**: Use `variant="secondary"` for standard actions, `variant="primary"` only for the main CTA on the screen.
* **Inputs**: Must have `labels` and proper `aria-invalid` states.
* **Cards**: White background, `border border-zinc-200`, `shadow-sm`.

## Accessibility (Non-negotiable)
* All images must have `alt` text.
* Interactive elements must be keyboard navigable.
* Focus rings must be visible (`focus-visible:ring-2`).

---

## Strickerei Jutta Brand Tokens

When implementing from HTML mockups, use these tokens:

### Stone Color Palette
```
stone-50:  #fafaf9  - Page background
stone-100: #f5f5f4  - Card hover, alternate backgrounds
stone-200: #e7e5e4  - Borders, dividers
stone-300: #d6d3d1  - Muted borders
stone-400: #a8a29e  - Placeholder text
stone-500: #78716c  - Secondary text
stone-600: #57534e  - Body text, nav links
stone-700: #44403c  - Dark accents
stone-800: #292524  - Primary (buttons, headings)
stone-900: #1c1917  - Extra dark
```

### Typography (Brand)
```css
/* Serif - Brand & Headings */
font-family: 'Playfair Display', serif;

/* Sans - UI & Body */
font-family: 'Inter', system-ui, sans-serif;
```

**Usage patterns:**
- Page headings: `font-serif text-2xl md:text-3xl font-medium text-stone-800`
- Brand/Logo: `font-serif text-xl font-medium text-stone-800`
- Tagline: `text-xs text-stone-500 tracking-wider`
- Body text: `text-stone-600`
- Secondary text: `text-sm text-stone-500`

### Custom CSS Classes
Add to `globals.css` for mockup implementation:

```css
/* Navigation link with underline animation */
.nav-link {
  @apply relative transition-all duration-300;
}
.nav-link:hover {
  @apply text-stone-600;
}
.nav-link::after {
  content: '';
  @apply absolute -bottom-0.5 left-0 w-0 h-px bg-stone-600 transition-all duration-300;
}
.nav-link:hover::after {
  @apply w-full;
}

/* Card hover lift effect */
.hover-lift {
  @apply transition-all duration-300;
}
.hover-lift:hover {
  @apply -translate-y-0.5;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

/* Fade in animation */
.fade-in {
  @apply opacity-0 translate-y-5;
  animation: fadeInUp 0.8s ease forwards;
}
@keyframes fadeInUp {
  to {
    @apply opacity-100 translate-y-0;
  }
}
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }
```

### Component Patterns (Brand)

**Product Card:**
```tsx
<div className="group cursor-pointer hover-lift bg-white rounded-lg overflow-hidden shadow-sm border border-stone-200">
  <div className="relative">
    <div className="aspect-[3/4]">{/* Image */}</div>
  </div>
  <div className="p-4">
    <h3 className="font-medium text-stone-800 mb-2">{title}</h3>
    <p className="text-sm text-stone-600 mb-2">{subtitle}</p>
    <span className="font-medium text-stone-800">€ {price}</span>
  </div>
</div>
```

**Buttons (Brand):**
```tsx
// Primary
className="bg-stone-800 text-white py-3 px-6 text-sm font-medium hover:bg-stone-700 transition-colors"

// Secondary
className="border border-stone-300 text-stone-600 py-3 px-6 text-sm font-medium hover:bg-stone-50 transition-colors"
```

**Navigation:**
```tsx
<nav className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
```

### Important: Combining with MedusaJS UI

When implementing brand styling, **layer on top of @medusajs/ui**, don't replace:

```tsx
// ✅ CORRECT: Extend MedusaJS UI with brand classes
import { Button } from "@medusajs/ui"
<Button className="bg-stone-800 hover:bg-stone-700">Add to Cart</Button>

// ❌ WRONG: Bypass MedusaJS UI entirely
<button className="bg-stone-800">Add to Cart</button>
```

This ensures accessibility, focus states, and loading states from MedusaJS UI are preserved.
