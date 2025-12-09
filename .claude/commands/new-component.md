# New Component

Scaffold a new component following project conventions and MedusaJS patterns.

## Prerequisites
- Read @.claude/documentation/style-guide.md
- Check @.claude/task/context_04.md for existing components
- Check @.claude/task/context_05.md for naming conventions

## Instructions
1. Use the **component-builder** subagent
2. Check if similar component exists in @medusajs/ui
3. If yes, extend it with brand styling
4. If no, build using @headlessui/react as base
5. Create component with:
   - TypeScript interface for props
   - @medusajs/ui as foundation when applicable
   - clx() for conditional styling
   - Responsive classes (mobile-first)
   - Dark mode support (dark: variants)
6. Place in correct module folder
7. Update @.claude/task/context_04.md

## Component Template
```tsx
import { clx } from "@medusajs/ui"

interface ComponentNameProps {
  // Define props with MedusaJS types when applicable
}

export function ComponentName({ ...props }: ComponentNameProps) {
  return (
    <div className={clx(
      "base-classes",
      "dark:dark-classes",
      "sm:responsive-classes"
    )}>
      {/* content */}
    </div>
  )
}
```

## Module Placement
```
storefront/src/modules/
├── layout/components/      # Header, Footer, Nav
├── products/components/    # ProductCard, Gallery
├── cart/components/        # CartItem, Summary
├── checkout/components/    # Forms, Steps
├── account/components/     # Profile, Orders
└── common/components/      # Shared utilities
```

## Usage
```
/new-component ProductCard products
/new-component CartDrawer cart
/new-component SizeSelector products
```
