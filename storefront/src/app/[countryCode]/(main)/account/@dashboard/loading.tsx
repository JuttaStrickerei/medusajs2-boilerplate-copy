/**
 * Seamless loading state for account dashboard tabs.
 * 
 * Returns null to keep the previous content visible during navigation.
 * This creates a smoother UX when switching between account tabs
 * (Overview, Profile, Addresses, Orders).
 * 
 * Fresh data for orders is still fetched (via cache: "no-store")
 * but without a jarring loading spinner between tab switches.
 */
export default function Loading() {
  // Return null for seamless tab transitions
  // The previous content stays visible until the new content is ready
  return null
}
