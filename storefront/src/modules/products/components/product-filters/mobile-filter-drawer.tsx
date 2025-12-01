import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { Button } from "@medusajs/ui"
import { FilterGroup } from "./index"

interface MobileFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  filterGroups: FilterGroup[]
  selectedFilters: Record<string, string[]>
  onFilterToggle: (groupId: string, value: string) => void
  onReset: () => void
  hasActiveFilters: boolean
  renderFilterGroup: (group: FilterGroup) => React.ReactNode
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  filterGroups,
  onReset,
  hasActiveFilters,
  renderFilterGroup,
}: MobileFilterDrawerProps) {
  const handleReset = () => {
    onReset()
    onClose()
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50 lg:hidden">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Drawer */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
                      <Dialog.Title className="text-base font-medium text-stone-800">
                        Filters
                      </Dialog.Title>
                      <button
                        onClick={onClose}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
                        aria-label="Close filters"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Filter Groups - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      <div className="space-y-6">
                        {filterGroups.map(renderFilterGroup)}
                      </div>
                    </div>

                    {/* Footer with Actions */}
                    {hasActiveFilters && (
                      <div className="border-t border-stone-200 px-6 py-4">
                        <button
                          onClick={handleReset}
                          className="w-full min-h-[44px] text-sm text-stone-600 hover:text-stone-800 transition-colors"
                        >
                          Reset All Filters
                        </button>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
