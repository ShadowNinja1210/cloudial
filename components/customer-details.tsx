"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Edit, Trash, Mail, Phone, MapPin } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

enum InvoiceStatus {
  PAID = "PAID",
  PENDING = "PENDING",
  PAST_DUE = "PAST_DUE",
}

interface Invoice {
  id: string;
  customerId: string;
  externalId?: string | null;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date | string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  externalId: string | null;
  invoices: Invoice[];
}

interface CustomerDetailsProps {
  customerId: string;
}

export function CustomerDetails({ customerId }: CustomerDetailsProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch customer");
        }
        const data = await response.json();
        setCustomer(data);
      } catch (error) {
        console.error("Error fetching customer:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const handleDelete = async () => {
    if (!customer) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting customer:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate totals
  const totalAmount = customer?.invoices.reduce((sum, invoice) => sum + invoice.amount, 0) || 0;
  const paidAmount =
    customer?.invoices
      .filter((invoice) => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.amount, 0) || 0;
  const pendingAmount =
    customer?.invoices
      .filter((invoice) => invoice.status === "PENDING")
      .reduce((sum, invoice) => sum + invoice.amount, 0) || 0;
  const overdueAmount =
    customer?.invoices
      .filter((invoice) => invoice.status === "PAST_DUE")
      .reduce((sum, invoice) => sum + invoice.amount, 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{isLoading ? <Skeleton className="h-7 w-40" /> : customer?.name}</CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-5 w-60 mt-1" />
            ) : (
              <>
                Customer ID: {customer?.id}
                {customer?.externalId && ` • External ID: ${customer.externalId}`}
              </>
            )}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/customer/${customerId}/edit`)}
            disabled={isLoading}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isLoading}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the customer and all their invoices. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer?.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer?.phone || "No phone number"}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer?.address || "No address"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Paid</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-green-500">{formatCurrency(paidAmount)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-yellow-500">{formatCurrency(pendingAmount)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-red-500">{formatCurrency(overdueAmount)}</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
