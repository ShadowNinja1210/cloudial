"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, Search } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  totalAmount: number
  outstandingAmount: number
  invoiceCount: number
}

interface PaginationData {
  page: number
  limit: number
  totalCustomers: number
  totalPages: number
}

export function CustomersTable() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCustomers: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        })

        if (debouncedQuery) {
          queryParams.append("search", debouncedQuery)
        }

        const response = await fetch(`/api/customers?${queryParams}`)
        const data = await response.json()

        setCustomers(data.customers)
        setPagination(data.pagination)
      } catch (error) {
        console.error("Error fetching customers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [pagination.page, pagination.limit, debouncedQuery])

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage your customers and their invoices</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => router.push("/customers/new")}>Add Customer</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-center">Invoices</TableHead>
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
                    <Skeleton className="h-5 w-[200px]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-[80px] ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-[80px] ml-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-5 w-[30px] mx-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-9 w-[40px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.totalAmount)}</TableCell>
                  <TableCell className="text-right">
                    <span className={customer.outstandingAmount > 0 ? "text-red-500" : ""}>
                      {formatCurrency(customer.outstandingAmount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{customer.invoiceCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/customer/${customer.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View customer</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {pagination.totalPages > 1 && (
        <CardFooter>
          <Pagination className="w-full">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1 || isLoading}
                />
              </PaginationItem>

              {Array.from({ length: pagination.totalPages }).map((_, index) => {
                const pageNumber = index + 1
                // Show current page, first, last, and pages around current
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.totalPages ||
                  (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        isActive={pageNumber === pagination.page}
                        onClick={() => handlePageChange(pageNumber)}
                        disabled={isLoading}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }

                // Show ellipsis for page gaps
                if (
                  (pageNumber === 2 && pagination.page > 3) ||
                  (pageNumber === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={`ellipsis-${pageNumber}`}>
                      <PaginationLink disabled>...</PaginationLink>
                    </PaginationItem>
                  )
                }

                return null
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                  disabled={pagination.page === pagination.totalPages || isLoading}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </Card>
  )
}
