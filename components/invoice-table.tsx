"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import { Eye, Plus, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Invoice {
  id: string
  customerId: string
  externalId: string | null
  amount: number
  status: string
  dueDate: string
  description: string | null
  createdAt: string
}

interface InvoiceTableProps {
  customerId: string
}

export function InvoiceTable({ customerId }: InvoiceTableProps) {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const queryParams = new URLSearchParams({
          customerId,
        })

        if (statusFilter) {
          queryParams.append("status", statusFilter)
        }

        const response = await fetch(`/api/invoices?${queryParams}`)
        if (!response.ok) {
          throw new Error("Failed to fetch invoices")
        }

        const data = await response.json()
        setInvoices(data.invoices)
      } catch (error) {
        console.error("Error fetching invoices:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (customerId) {
      fetchInvoices()
    }
  }, [customerId, statusFilter])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Invoices</CardTitle>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {statusFilter ? `Status: ${statusFilter}` : "Filter"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={statusFilter || ""}
                onValueChange={(value) => setStatusFilter(value || null)}
              >
                <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PENDING">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PAID">Paid</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PAST_DUE">Past Due</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="CANCELLED">Cancelled</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => router.push(`/customer/${customerId}/invoice/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-9 w-[40px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : invoices.length > 0 ? (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.id.substring(0, 8)}
                    {invoice.externalId && (
                      <span className="text-xs text-muted-foreground ml-2">Ext: {invoice.externalId}</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(new Date(invoice.createdAt))}</TableCell>
                  <TableCell>{formatDate(new Date(invoice.dueDate))}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>{invoice.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/customer/${customerId}/invoice/${invoice.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View invoice</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
