import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerDetails } from "@/components/customer-details";
import { InvoiceTable } from "@/components/invoice-table";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Customer Details",
  description: "View and manage customer details",
};

export default async function CustomerPage(props: CustomerPageProps) {
  const { id } = await props.params;

  if (!id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <CustomerDetails customerId={id} />
      <InvoiceTable customerId={id} />
    </div>
  );
}
