import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"
import { HelpCircle, Mail, RefreshCw } from "@components/icons"

const Help = () => {
  return (
    <div className="pt-6 border-t border-stone-200">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle size={18} className="text-stone-500" />
        <h2 className="font-medium text-stone-800">Brauchen Sie Hilfe?</h2>
      </div>
      
      <ul className="space-y-2">
        <li>
          <LocalizedClientLink 
            href="/contact"
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            <Mail size={14} />
            Kontakt aufnehmen
          </LocalizedClientLink>
        </li>
        <li>
          <LocalizedClientLink 
            href="/contact"
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            <RefreshCw size={14} />
            Rückgabe & Umtausch
          </LocalizedClientLink>
        </li>
      </ul>
    </div>
  )
}

export default Help
