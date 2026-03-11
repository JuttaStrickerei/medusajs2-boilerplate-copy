import { Metadata } from "next"
import WishlistContent from "@modules/wishlist/components/wishlist-content"

export const metadata: Metadata = {
  title: "Wunschliste",
  description: "Ihre gespeicherten Lieblingsprodukte",
}

export default function AccountWishlistPage() {
  return <WishlistContent />
}
