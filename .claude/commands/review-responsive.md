# Review Responsive

Audit a file or component for responsive design issues.

## Prerequisites
- Read @.claude/documentation/style-guide.md for breakpoints

## Instructions
1. Use the **responsive-auditor** subagent
2. Scan the specified file/path for responsive issues
3. Check for mobile-first violations
4. Verify all breakpoints are covered
5. Flag touch target issues (<44px)
6. Verify MedusaJS UI components remain functional
7. Report findings

## Breakpoints to Check
- 2xsmall: 320px (mobile)
- small: 640px (large mobile)
- medium: 768px (tablet)
- large: 1024px (desktop)
- xlarge: 1280px (large desktop)

## Common Issues
- Missing base (mobile) styles
- Hardcoded pixel widths
- Touch targets too small
- Navigation not collapsing
- Images not responsive

## Usage
```
/review-responsive storefront/src/modules/products/
/review-responsive storefront/src/modules/cart/components/cart-drawer.tsx
```

## Output Format
- List of files with issues
- Line numbers and descriptions
- Suggested fixes
- Coverage report per breakpoint
