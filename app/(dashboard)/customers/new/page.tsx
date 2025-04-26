import type { Metadata } from "next"
import { CustomerForm } from "@/components/customer/customer-form"

export const metadata: Metadata = {
  title: "Add Customer",
  description: "Add a new customer",
}

export default function NewCustomerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Customer</h1>
        <p className="text-muted-foreground">Create a new customer record</p>
      </div>

      <CustomerForm />
    </div>
  )
}
