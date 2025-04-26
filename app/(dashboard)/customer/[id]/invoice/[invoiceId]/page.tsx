import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { InvoiceDetails } from "@/components/invoice/invoice-details"
import prisma from "@/lib/prisma"

interface InvoicePageProps {
  params: {
    id: string
    invoiceId: string
  }
}

export const metadata: Metadata = {
  title: "Invoice Details",
  description: "View and manage invoice details",
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  if (!params.id || !params.invoiceId) {
    notFound()
  }

  // Verify invoice exists and belongs to the customer
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: params.invoiceId,
      customerId: params.id,
    },
  })

  if (!invoice) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <InvoiceDetails customerId={params.id} invoiceId={params.invoiceId} />
    </div>
  )
}
