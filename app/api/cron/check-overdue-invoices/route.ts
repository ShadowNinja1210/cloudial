import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    // Verify cron secret to ensure this endpoint is only called by authorized services
    const { searchParams } = new URL(req.url)
    const cronSecret = searchParams.get("secret")

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all pending invoices that are past due
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: today,
        },
      },
      include: {
        customer: true,
      },
    })

    // Update status to PAST_DUE and create audit logs
    const updates = []
    const auditLogs = []
    const emailNotifications = []

    for (const invoice of overdueInvoices) {
      updates.push(
        prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "PAST_DUE" },
        }),
      )

      auditLogs.push(
        prisma.invoiceAuditLog.create({
          data: {
            invoiceId: invoice.id,
            fieldChanged: "status",
            previousValue: "PENDING",
            newValue: "PAST_DUE",
          },
        }),
      )

      // Mock email notification (in a real app, you would use a proper email service)
      emailNotifications.push({
        to: invoice.customer.email,
        subject: `Invoice #${invoice.id} is overdue`,
        body: `Dear ${invoice.customer.name},\n\nYour invoice #${invoice.id} for $${invoice.amount} was due on ${invoice.dueDate.toLocaleDateString()}. Please make payment as soon as possible.\n\nThank you,\nYour Company`,
      })
    }

    // Execute all database operations
    await Promise.all([...updates, ...auditLogs])

    // In a real application, you would send actual emails here
    console.log("Email notifications to send:", emailNotifications)

    return NextResponse.json({
      success: true,
      updatedInvoices: overdueInvoices.length,
      emailsSent: emailNotifications.length,
    })
  } catch (error) {
    console.error("Error checking overdue invoices:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
