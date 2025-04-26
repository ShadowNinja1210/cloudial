import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total customers
    const totalCustomers = await prisma.customer.count()

    // Get total invoices and sum by status
    const invoiceStats = await prisma.invoice.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    })

    // Calculate totals
    let totalInvoices = 0
    let totalRevenue = 0
    let pendingRevenue = 0
    let overdueRevenue = 0

    invoiceStats.forEach((stat) => {
      totalInvoices += stat._count.id

      if (stat._sum.amount) {
        if (stat.status === "PAID") {
          totalRevenue += stat._sum.amount
        } else if (stat.status === "PENDING") {
          pendingRevenue += stat._sum.amount
        } else if (stat.status === "PAST_DUE") {
          overdueRevenue += stat._sum.amount
        }
      }
    })

    // Get monthly revenue data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as revenue,
        COUNT(*) as count
      FROM "Invoice"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `

    return NextResponse.json({
      totalCustomers,
      totalInvoices,
      totalRevenue,
      pendingRevenue,
      overdueRevenue,
      invoicesByStatus: invoiceStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {}),
      monthlyRevenue,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
