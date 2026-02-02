---
name: db-generate
description: Generate database migrations for a Medusa module. Use when creating new modules, adding data models, or modifying existing models.
---

# Generate Database Migrations

Generate database migrations for the specified Medusa module.

The user will provide the module name as an argument (e.g., `brand`, `product`, `custom-module`).

For example: `db-generate brand`

Use the Shell tool to execute the command `npx medusa db:generate <module-name>`, replacing `<module-name>` with the provided argument.

Report the results to the user, including:

- The module name for which migrations were generated
- Migration file name or location
- Any errors or warnings
- Next steps (running `npx medusa db:migrate` to apply the migrations)
