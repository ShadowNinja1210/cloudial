import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoice-form";
import prisma from "@/lib/prisma";

interface NewInvoicePageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "New Invoice",
  description: "Create a new invoice",
};

export default async function NewInvoicePage({ params }: NewInvoicePageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: id },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
        <p className="text-muted-foreground">Create a new invoice for {customer.name}</p>
      </div>

      <InvoiceForm customerId={id} />
    </div>
  );
}
