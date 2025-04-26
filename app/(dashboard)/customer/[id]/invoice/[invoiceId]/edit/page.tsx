import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoice-form";
import prisma from "@/lib/prisma";

interface EditInvoicePageProps {
  params: {
    id: string;
    invoiceId: string;
  };
}

export const metadata: Metadata = {
  title: "Edit Invoice",
  description: "Edit invoice details",
};

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  if (!params.id || !params.invoiceId) {
    notFound();
  }

  // Verify invoice exists and belongs to the customer
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: params.invoiceId,
      customerId: params.id,
    },
  });

  if (!invoice) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
        <p className="text-muted-foreground">Update invoice information</p>
      </div>

      <InvoiceForm customerId={params.id} invoice={invoice} isEditing={true} />
    </div>
  );
}
