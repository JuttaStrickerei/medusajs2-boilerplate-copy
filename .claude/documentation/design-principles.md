# Design Principles & Philosophy

Our goal is to build an interface that feels "inevitable"—as if it couldn't have been designed any other way. We blend **Stripe's precision**, **Apple's harmony**, and **Microsoft's fluency**.

## 1. Meticulous Craftsmanship (The Stripe Way)
* **Pixel Perfection**: Alignments must be exact. If a button is 40px high, the input next to it must be 40px high.
* **Micro-Interactions**: Every click, hover, and focus state must provide feedback. No interaction should feel "dead."
* **Developer-Grade Clarity**: Error messages should be helpful and human. "Something went wrong" is forbidden; explain *what* and *how to fix it*.

## 2. Visual Hierarchy & Harmony (The Apple Way)
* **Content First**: The UI should recede. Use whitespace (negative space) to group related items, not lines or boxes.
* **Touch Targets**: Minimum interactive size is 44x44pt.
* **Typography as UI**: Use font weight (Medium/Semibold) and color (Zinc-500 vs Zinc-900) to create hierarchy, rather than changing font sizes drastically.

## 3. Fluidity & Material (The Fluent Way)
* **Motion**: Transitions should be quick (150ms-300ms) and use cubic-bezier curves (e.g., `ease-out`). Things should not just "pop" into existence; they should fade or slide in.
* **Depth**: Use subtle shadows (`shadow-sm`, `shadow-md`) to indicate elevation. The highest element (modals) gets the deepest shadow.
* **Glass & Blur**: Use backdrops (`backdrop-blur-sm`) for sticky headers and overlays to maintain context of what's behind.

## Practical Rules for Agents
1. **Default to Tailwind**: Use standard Tailwind colors (`zinc`, `neutral`) unless specified otherwise.
2. **Border Radius**: Use consistent rounding (e.g., `rounded-lg` for cards, `rounded-md` for buttons). Never mix `rounded-none` and `rounded-2xl` arbitrarily.
3. **Loading States**: Always implement skeletons (`<Skeleton />`) for data fetching states. Never show a blank screen.

## Strickerei Jutta Brand Extensions

When implementing the Strickerei Jutta design (from mockups):

### Brand Identity
- **Store Name**: Strickerei Jutta
- **Tagline**: "SEIT 1965" (Since 1965)
- **Language**: German (de)
- **Aesthetic**: Elegant, minimal, warm, artisanal

### Color Philosophy
The Stone palette creates a warm, natural feel that complements knitwear products:
- Stone-50 (#fafaf9) as background creates a soft, welcoming canvas
- Stone-800 (#292524) as primary creates sophisticated contrast
- The warm undertones differentiate from cold corporate grays

### Typography Philosophy
- **Playfair Display** (serif): Used for brand name, page headings - conveys tradition and craftsmanship
- **Inter** (sans): Used for UI, body text - ensures readability and modern feel
- The combination balances heritage with contemporary usability

### Animation Philosophy
- **hover-lift**: Subtle elevation on cards creates tactile feedback
- **nav-link underline**: Progressive disclosure of interactivity
- **fade-in-up**: Content reveals feel natural, not abrupt
- Keep animations subtle - the product is the hero, not the UI
