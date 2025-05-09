import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceDetails } from "@/components/invoice-details";
import prisma from "@/lib/prisma";

interface InvoicePageProps {
  params: Promise<{
    id: string;
    invoiceId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Invoice Details",
  description: "View and manage invoice details",
};

export default async function InvoicePage({ params }: InvoicePageProps) {
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
      <InvoiceDetails customerId={id} invoiceId={invoiceId} />
    </div>
  );
}
