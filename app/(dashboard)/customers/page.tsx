import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage your customers",
}

export default function CustomersPage() {
  redirect("/dashboard")
}
