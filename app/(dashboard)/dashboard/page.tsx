import type { Metadata } from "next";
import { StatsCards } from "@/components/stats-cards";
import { RevenueChart } from "@/components/revenue-chart";
import { CustomersTable } from "@/components/customers-table";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your business",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business performance and customer data</p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-4">
        <RevenueChart />
      </div>

      <CustomersTable />
    </div>
  );
}
