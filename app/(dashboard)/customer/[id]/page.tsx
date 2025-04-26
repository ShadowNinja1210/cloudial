import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerDetails } from "@/components/customer-details";
import { InvoiceTable } from "@/components/invoice-table";

interface CustomerPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: "Customer Details",
  description: "View and manage customer details",
};

export default function CustomerPage({ params }: CustomerPageProps) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <CustomerDetails customerId={params.id} />
      <InvoiceTable customerId={params.id} />
    </div>
  );
}
