import { redirect } from "next/navigation"

export default function DashboardDefault() {
  // Redirect to main account page for unmatched routes
  redirect("/account")
}

