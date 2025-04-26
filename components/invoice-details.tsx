"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import { Edit, Trash, FileText } from "lucide-react"
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
} from "@/components/ui/alert-dialog"

interface InvoiceDetailsProps {
  customerId: string
  invoiceId: string
}

export function InvoiceDetails({ customerId, invoiceId }: InvoiceDetailsProps) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch invoice")
        }
        const data = await response.json()
        setInvoice(data)
      } catch (error) {
        console.error("Error fetching invoice:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const handleDelete = async () => {
    if (!invoice) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete invoice")
      }

      router.push(`/customer/${customerId}`)
    } catch (error) {
      console.error("Error deleting invoice:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>
            {isLoading ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              <>
                Invoice #{invoice?.id.substring(0, 8)}
                {invoice?.externalId && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    External ID: {invoice.externalId}
                  </span>
                )}
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-5 w-60 mt-1" />
            ) : (
              <>Created on {formatDate(new Date(invoice?.createdAt))}</>
            )}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/customer/${customerId}/invoice/${invoiceId}/edit`)}
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
                  This will permanently delete this invoice. This action cannot be undone.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
                <p className="font-medium">{invoice?.customer?.name}</p>
                <p className="text-sm text-muted-foreground">{invoice?.customer?.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <Badge className={getStatusColor(invoice?.status)}>{invoice?.status.replace("_", " ")}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Amount</h3>
                <p className="text-2xl font-bold">{formatCurrency(invoice?.amount)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h3>
                <p className="font-medium">{formatDate(new Date(invoice?.dueDate))}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p>{invoice?.description || "No description"}</p>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Audit Log</h3>
              {invoice?.auditLogs && invoice.auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {invoice.auditLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-2 text-sm border-l-2 border-muted pl-3 py-1">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p>
                          <span className="font-medium">{log.fieldChanged}</span>
                          {log.fieldChanged !== "creation" && (
                            <>
                              {" "}
                              changed from <span className="font-medium">{log.previousValue}</span> to{" "}
                              <span className="font-medium">{log.newValue}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(new Date(log.timestamp))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No audit logs available</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
