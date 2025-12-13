"use client"

import { useState } from "react"
import { Search } from "@components/icons"
import SearchModal from "../search-modal"

export default function SearchButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all"
        aria-label="Suchen"
      >
        <Search size={20} />
      </button>

      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

