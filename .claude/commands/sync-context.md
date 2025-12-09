# Sync Context

Update the task context files with current project state.

## Context Files
Located in `.claude/task/`:

| File | Purpose | Update When |
|------|---------|-------------|
| context_01.md | Architecture | Routes/structure changes |
| context_02.md | Design tokens | Theme/styling changes |
| context_03.md | API contracts | Data fetching changes |
| context_04.md | Components | Components added/modified |
| context_05.md | Conventions | Standards updated |
| context_06.md | Mockup reference | Mockup status changes |

## Instructions
1. Scan the codebase for recent changes
2. Update the specified context file
3. Keep token count minimal (<250 tokens per file)
4. Summarize changes made

## Token Efficiency Rules
- Use tables for structured data
- Use code blocks only for patterns
- Omit obvious details
- Focus on what agents need to know

## Usage
```
/sync-context 01    # Update architecture
/sync-context 02    # Update design tokens
/sync-context 03    # Update API contracts
/sync-context 04    # Update component inventory
/sync-context all   # Update all context files
```

## Output
- Updated context file
- Summary of changes
- Token count estimate
