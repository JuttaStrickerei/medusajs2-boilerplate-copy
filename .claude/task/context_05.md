# Conventions

## Naming
- Components: PascalCase (`ProductCard.tsx`)
- Files: kebab-case or PascalCase (match existing)
- Server Actions: camelCase verbs (`addToCart`)
- Hooks: `use*` prefix (`useCart`)
- Types: PascalCase + suffix (`ProductCardProps`)

## File Structure
```
modules/{feature}/
├── components/
│   ├── component-name.tsx
│   └── index.ts          # Re-exports
├── actions.ts            # Server Actions
├── templates/            # Page-level components
└── index.ts
```

## TypeScript
- Strict mode enabled
- NO `any` types
- Use MedusaJS types: `HttpTypes.Store*`
- Props interfaces: `ComponentNameProps`

## Component Rules
- Server Components by default
- `'use client'` only when needed
- @medusajs/ui as foundation
- clx() for class composition

## Styling Rules
- Tailwind utility classes only
- NO CSS Modules
- NO styled-components
- Mobile-first responsive
- Include dark: variants

## Git Commits
- `feat:` New feature
- `fix:` Bug fix
- `style:` UI/styling
- `refactor:` Code restructure
