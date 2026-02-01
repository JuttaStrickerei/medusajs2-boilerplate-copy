# Forms and Modal Patterns

## Contents
- [FocusModal vs Drawer](#focusmodal-vs-drawer)
- [Edit Button Patterns](#edit-button-patterns)
- [Select Component for Small Datasets](#select-component-for-small-datasets)
- [FocusModal Example](#focusmodal-example)
- [Drawer Example](#drawer-example)
- [Form with Validation and Loading States](#form-with-validation-and-loading-states)
- [Key Form Patterns](#key-form-patterns)

## FocusModal vs Drawer

**FocusModal** - Use for creating new entities:
- Full-screen modal
- More space for complex forms
- Better for multi-step flows

**Drawer** - Use for editing existing entities:
- Side panel that slides in from right
- Quick edits without losing context
- Better for single-field updates

**Rule of thumb:** FocusModal for creating, Drawer for editing.

## Edit Button Patterns

Data displayed in a container should not be editable directly. Instead, use an "Edit" button.

### Simple Edit Button (top right corner)

```tsx
import { Button } from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"

<div className="flex items-center justify-between">
  <Heading>Section Title</Heading>
  <Button
    variant="transparent"
    size="small"
    onClick={() => setOpen(true)}
  >
    <PencilSquare />
  </Button>
</div>
```

### Dropdown Menu with Actions

```tsx
import { EllipsisHorizontal, PencilSquare, Plus, Trash } from "@medusajs/icons"
import { DropdownMenu, IconButton } from "@medusajs/ui"

<DropdownMenu>
  <DropdownMenu.Trigger asChild>
    <IconButton variant="transparent" size="small">
      <EllipsisHorizontal />
    </IconButton>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item className="gap-x-2">
      <PencilSquare />
      Edit
    </DropdownMenu.Item>
    <DropdownMenu.Item className="gap-x-2">
      <Plus />
      Add
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item className="gap-x-2">
      <Trash />
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>
```

## Select Component for Small Datasets

For selecting from 2-10 options (statuses, types, etc.), use the Select component:

```tsx
import { Select } from "@medusajs/ui"

<Select value={value} onValueChange={setValue}>
  <Select.Trigger>
    <Select.Value placeholder="Select option" />
  </Select.Trigger>
  <Select.Content>
    {items.map((item) => (
      <Select.Item key={item.value} value={item.value}>
        {item.label}
      </Select.Item>
    ))}
  </Select.Content>
</Select>
```

**For larger datasets** (Products, Categories, Regions, etc.), use DataTable with FocusModal. See [table-selection.md](table-selection.md) for the complete pattern.

## FocusModal Example

```tsx
import { FocusModal, Button, Input, Label } from "@medusajs/ui"
import { useState } from "react"

const MyWidget = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ title: "" })

  const handleSubmit = () => {
    console.log(formData)
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create New</Button>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <FocusModal.Title>Create Item</FocusModal.Title>
            <div className="flex items-center gap-x-2">
              <FocusModal.Close asChild>
                <Button variant="secondary" size="small">Cancel</Button>
              </FocusModal.Close>
              <Button onClick={handleSubmit} size="small">Save</Button>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex flex-col gap-y-4 px-6 py-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </>
  )
}
```

## Drawer Example

```tsx
import { Drawer, Button, Input, Label } from "@medusajs/ui"
import { useState } from "react"

const MyWidget = ({ data }) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ title: data.title })

  const handleSubmit = () => {
    console.log(formData)
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit</Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Settings</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-4 px-6 py-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </Drawer.Body>

          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary" size="small">Cancel</Button>
            </Drawer.Close>
            <Button onClick={handleSubmit} size="small">Save</Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}
```

## Form with Validation and Loading States

```tsx
import { FocusModal, Button, Input, Label, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/client"

const CreateProductWidget = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ title: "", description: "" })
  const [errors, setErrors] = useState({})
  const queryClient = useQueryClient()

  const createProduct = useMutation({
    mutationFn: (data) => sdk.admin.product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product created successfully")
      setOpen(false)
      setFormData({ title: "", description: "" })
      setErrors({})
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product")
    },
  })

  const handleSubmit = () => {
    // Validate
    const newErrors = {}
    if (!formData.title) newErrors.title = "Title is required"
    if (!formData.description) newErrors.description = "Description is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createProduct.mutate(formData)
  }

  return (
    <FocusModal open={open} onOpenChange={setOpen}>
      <FocusModal.Content>
        <FocusModal.Header>
          <Button
            onClick={handleSubmit}
            size="small"
            disabled={createProduct.isPending}
            isLoading={createProduct.isPending}
          >
            Save
          </Button>
        </FocusModal.Header>

        <FocusModal.Body className="flex flex-col gap-y-4 px-6 py-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value })
                setErrors({ ...errors, title: undefined })
              }}
            />
            {errors.title && (
              <Text className="text-ui-fg-error">{errors.title}</Text>
            )}
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
```

## Key Form Patterns

### Always Disable Actions During Mutations

```tsx
<Button
  disabled={mutation.isPending}
  onClick={handleAction}
>
  Action
</Button>
```

### Show Loading State on Submit Button

```tsx
<Button
  isLoading={mutation.isPending}
  disabled={mutation.isPending}
>
  Save
</Button>
```

### Clear Form After Success

```tsx
onSuccess: () => {
  setFormData(initialState)
  setErrors({})
  setOpen(false)
}
```

### Validate Before Submitting

```tsx
const handleSubmit = () => {
  const errors = validateForm(formData)
  if (Object.keys(errors).length > 0) {
    setErrors(errors)
    return
  }
  mutation.mutate(formData)
}
```

### Clear Field Errors on Input Change

```tsx
<Input
  value={formData.field}
  onChange={(e) => {
    setFormData({ ...formData, field: e.target.value })
    setErrors({ ...errors, field: undefined }) // Clear error
  }}
/>
```
