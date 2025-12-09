# Component Inventory

## MedusaJS UI (USE FIRST)
Button, Input, Select, Badge, Container, Label, Checkbox, RadioGroup, Textarea, Heading, Text, Table, IconButton, Toaster

## @headlessui/react
Dialog, Menu, Listbox, Combobox, Disclosure, Popover, Tabs, Switch

## Existing Storefront Components
Check `storefront/src/modules/*/components/` for existing implementations before creating new ones.

## Brand Components (From Mockups)

### Implemented ✅
| Component | Mockup | Module | Status |
|-----------|--------|--------|--------|
| Header (brand) | all | layout | ✅ DONE |
| Footer (brand) | all | layout | ✅ DONE (pre-existing) |
| ProductCard (brand) | product-catalog | products | ✅ DONE |
| ProductFilters | product-catalog | products | ✅ DONE |
| MobileFilterDrawer | product-catalog | products | ✅ DONE |

### To Build
| Component | Mockup | Module | Status |
| SizeSelector | product-detail | products | 📋 |
| ColorSelector | product-detail | products | 📋 |
| ImageGallery | product-detail | products | 📋 |
| ProductTabs | product-detail | products | 📋 |
| CartItem (brand) | shopping-cart | cart | 📋 |
| CartSummary (brand) | shopping-cart | cart | 📋 |
| AccountSidebar | user-account | account | 📋 |
| OrderHistory | user-account | account | 📋 |
| SizeGuideModal | size-guide | products | 📋 |

## Status
✅ Done | 🔄 In Progress | 📋 Planned

## Import Pattern
```tsx
import { Button } from "@medusajs/ui"
import { clx } from "@medusajs/ui"
import { Dialog } from "@headlessui/react"
```
