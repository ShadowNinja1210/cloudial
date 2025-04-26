import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CustomerForm } from "@/components/customer/customer-form"
import prisma from "@/lib/prisma"

interface EditCustomerPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: "Edit Customer",
  description: "Edit customer details",
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  if (!params.id) {
    notFound()
  }

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
  })

  if (!customer) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
        <p className="text-muted-foreground">Update customer information</p>
      </div>

      <CustomerForm customer={customer} isEditing={true} />
    </div>
  )
}
