import type { Meta, StoryObj } from "@storybook/react"
import ProductFilters from "@modules/products/components/product-filters"
import type { FilterGroup } from "@modules/products/components/product-filters"

const meta: Meta<typeof ProductFilters> = {
  title: "Products/ProductFilters",
  component: ProductFilters,
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof ProductFilters>

// Sample filter data
const sampleFilterGroups: FilterGroup[] = [
  {
    id: "color",
    label: "Farbe",
    options: [
      { id: "col-1", label: "Natur", value: "natural", count: 24 },
      { id: "col-2", label: "Navy", value: "navy", count: 18 },
      { id: "col-3", label: "Grau", value: "gray", count: 15 },
      { id: "col-4", label: "Schwarz", value: "black", count: 12 },
      { id: "col-5", label: "Weiß", value: "white", count: 8 },
    ],
  },
  {
    id: "size",
    label: "Größe",
    options: [
      { id: "size-1", label: "XS", value: "xs", count: 10 },
      { id: "size-2", label: "S", value: "s", count: 22 },
      { id: "size-3", label: "M", value: "m", count: 28 },
      { id: "size-4", label: "L", value: "l", count: 25 },
      { id: "size-5", label: "XL", value: "xl", count: 15 },
    ],
  },
  {
    id: "material",
    label: "Material",
    options: [
      { id: "mat-1", label: "Wolle", value: "wool", count: 30 },
      { id: "mat-2", label: "Baumwolle", value: "cotton", count: 20 },
      { id: "mat-3", label: "Kaschmir", value: "cashmere", count: 8 },
      { id: "mat-4", label: "Seide", value: "silk", count: 5 },
      { id: "mat-5", label: "Leinen", value: "linen", count: 12 },
    ],
  },
  {
    id: "price",
    label: "Preis",
    options: [
      { id: "price-1", label: "Unter 50€", value: "0-50" },
      { id: "price-2", label: "50€ - 100€", value: "50-100" },
      { id: "price-3", label: "100€ - 200€", value: "100-200" },
      { id: "price-4", label: "Über 200€", value: "200-999999" },
    ],
  },
]

export const Default: Story = {
  args: {
    filterGroups: sampleFilterGroups,
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-stone-50 p-8">
        <div className="max-w-7xl mx-auto flex gap-8">
          <Story />
          <div className="flex-1">
            <div className="bg-white p-6 rounded-lg border border-stone-200">
              <h2 className="text-xl font-medium text-stone-800 mb-4">
                Product Grid Placeholder
              </h2>
              <p className="text-stone-600">
                This is where your product grid would appear. Try selecting
                filters to see the URL update.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] bg-stone-100 rounded-lg"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
}

export const MinimalFilters: Story = {
  args: {
    filterGroups: [
      {
        id: "category",
        label: "Kategorie",
        options: [
          { id: "cat-1", label: "Strickwaren", value: "knitwear", count: 45 },
          { id: "cat-2", label: "Accessoires", value: "accessories", count: 23 },
        ],
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-stone-50 p-8">
        <Story />
      </div>
    ),
  ],
}

export const ManyOptions: Story = {
  args: {
    filterGroups: [
      {
        id: "style",
        label: "Stil",
        options: Array.from({ length: 15 }, (_, i) => ({
          id: `style-${i}`,
          label: `Style Option ${i + 1}`,
          value: `style-${i + 1}`,
          count: Math.floor(Math.random() * 30) + 5,
        })),
      },
      ...sampleFilterGroups,
    ],
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-stone-50 p-8">
        <Story />
      </div>
    ),
  ],
}

export const MobileView: Story = {
  args: {
    filterGroups: sampleFilterGroups,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-stone-50 p-4">
        <div className="space-y-4">
          <Story />
          <div className="bg-white p-4 rounded-lg border border-stone-200">
            <h2 className="text-lg font-medium text-stone-800 mb-3">
              Product Grid
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] bg-stone-100 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  ],
}

export const CustomWidth: Story = {
  args: {
    filterGroups: sampleFilterGroups,
    className: "lg:w-80",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-stone-50 p-8">
        <div className="max-w-7xl mx-auto flex gap-8">
          <Story />
          <div className="flex-1 bg-white p-6 rounded-lg border border-stone-200">
            <p className="text-stone-600">Custom width filter sidebar (320px)</p>
          </div>
        </div>
      </div>
    ),
  ],
}
