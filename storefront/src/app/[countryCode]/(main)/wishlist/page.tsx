import { Metadata } from "next"
import WishlistTemplate from "@modules/wishlist/templates"

export const metadata: Metadata = {
  title: "Wunschliste",
  description: "Ihre gespeicherten Lieblingsprodukte",
}

export default function WishlistPage() {
  return <WishlistTemplate />
}
