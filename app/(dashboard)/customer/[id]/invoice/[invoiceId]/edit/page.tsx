import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoice-form";
import prisma from "@/lib/prisma";

interface EditInvoicePageProps {
  params: Promise<{
    id: string;
    invoiceId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Edit Invoice",
  description: "Edit invoice details",
};

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id, invoiceId } = await params;

  if (!id || !invoiceId) {
    notFound();
  }

  // Verify invoice exists and belongs to the customer
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      customerId: id,
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

      <InvoiceForm customerId={id} invoice={invoice} isEditing={true} />
    </div>
  );
}
