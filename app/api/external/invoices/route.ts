import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { externalCustomerId, externalInvoiceId, amount, dueDate, description } = await req.json()

    if (!externalCustomerId || !externalInvoiceId || !amount || !dueDate) {
      return NextResponse.json(
        { error: "External customer ID, external invoice ID, amount, and due date are required" },
        { status: 400 },
      )
    }

    // Find customer by externalId
    const customer = await prisma.customer.findUnique({
      where: { externalId: externalCustomerId },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer with this external ID not found" }, { status: 404 })
    }

    // Check if invoice with this externalId already exists for this customer
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        customerId: customer.id,
        externalId: externalInvoiceId,
      },
    })

    let invoice
    let action = "created"

    if (existingInvoice) {
      // Update existing invoice
      action = "updated"

      // Create audit logs for changed fields
      const auditLogs = []

      if (amount !== existingInvoice.amount) {
        auditLogs.push({
          invoiceId: existingInvoice.id,
          fieldChanged: "amount",
          previousValue: existingInvoice.amount.toString(),
          newValue: amount.toString(),
        })
      }

      if (new Date(dueDate).toISOString() !== existingInvoice.dueDate.toISOString()) {
        auditLogs.push({
          invoiceId: existingInvoice.id,
          fieldChanged: "dueDate",
          previousValue: existingInvoice.dueDate.toISOString(),
          newValue: new Date(dueDate).toISOString(),
        })
      }

      if (description !== existingInvoice.description) {
        auditLogs.push({
          invoiceId: existingInvoice.id,
          fieldChanged: "description",
          previousValue: existingInvoice.description || "",
          newValue: description || "",
        })
      }

      // Update invoice
      invoice = await prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: {
          amount: Number.parseFloat(amount.toString()),
          dueDate: new Date(dueDate),
          description,
        },
      })

      // Create audit logs
      if (auditLogs.length > 0) {
        await prisma.invoiceAuditLog.createMany({
          data: auditLogs,
        })
      }
    } else {
      // Create new invoice
      invoice = await prisma.invoice.create({
        data: {
          customerId: customer.id,
          externalId: externalInvoiceId,
          amount: Number.parseFloat(amount.toString()),
          status: "PENDING",
          dueDate: new Date(dueDate),
          description,
        },
      })

      // Create audit log entry for invoice creation
      await prisma.invoiceAuditLog.create({
        data: {
          invoiceId: invoice.id,
          fieldChanged: "creation",
          previousValue: "",
          newValue: "Invoice created via external API",
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Invoice ${action} successfully`,
      invoice: {
        id: invoice.id,
        externalId: invoice.externalId,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate,
      },
    })
  } catch (error) {
    console.error("Error processing external invoice:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
