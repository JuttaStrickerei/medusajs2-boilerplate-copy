# Adapt Layout

Adapt a page layout from the HTML mockups to the MedusaJS storefront.

## Prerequisites
- Read @.claude/documentation/style-guide.md
- Read @.claude/documentation/design-principles.md
- Check @.claude/task/context_04.md for existing components

## Instructions
1. Spawn the **design-adapter** subagent
2. Read the target mockup from `.claude/mockups/`
3. Identify all layout sections (nav, main content, footer)
4. Map mockup elements to @medusajs/ui components
5. Create/update corresponding Next.js layout and page components
6. Integrate with existing MedusaJS data fetchers
7. Preserve all animations and transitions
8. Update context files with changes
9. **TEST that existing functionality still works**

## Mockup → Route Mapping
| Mockup File | Target Location |
|-------------|-----------------|
| product-catalog.html | storefront/src/app/[countryCode]/(main)/collections/[handle]/page.tsx |
| product-detail.html | storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx |
| shopping-cart.html | storefront/src/app/[countryCode]/(main)/cart/page.tsx |
| user-account.html | storefront/src/app/[countryCode]/(main)/account/page.tsx |
| contact.html | storefront/src/app/[countryCode]/(main)/contact/page.tsx |
| size-guide.html | storefront/src/modules/products/components/size-guide-modal.tsx |

## CRITICAL: Preserve MedusaJS
- Use existing data fetchers from `storefront/src/lib/data/`
- Keep existing cart/checkout/account logic
- Build on @medusajs/ui components
- Maintain Server/Client component boundaries

## Usage
```
/adapt-layout product-catalog
/adapt-layout product-detail
/adapt-layout shopping-cart
```

## Output
- New/updated component files
- Updated @.claude/task/context_04.md
- Summary of changes
- Confirmation existing flows still work
