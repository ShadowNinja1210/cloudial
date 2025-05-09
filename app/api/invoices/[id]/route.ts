import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const invoiceId = id;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        auditLogs: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const invoiceId = id;
    const { externalId, amount, status, dueDate, description } = await req.json();

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if externalId is already used by another invoice for the same customer
    if (externalId && externalId !== existingInvoice.externalId) {
      const invoiceWithExternalId = await prisma.invoice.findFirst({
        where: {
          customerId: existingInvoice.customerId,
          externalId,
          id: { not: invoiceId },
        },
      });

      if (invoiceWithExternalId) {
        return NextResponse.json({ error: "External ID is already in use for this customer" }, { status: 400 });
      }
    }

    // Create audit logs for changed fields
    const auditLogs = [];

    if (amount !== undefined && amount !== existingInvoice.amount) {
      auditLogs.push({
        invoiceId,
        fieldChanged: "amount",
        previousValue: existingInvoice.amount.toString(),
        newValue: amount.toString(),
      });
    }

    if (status && status !== existingInvoice.status) {
      auditLogs.push({
        invoiceId,
        fieldChanged: "status",
        previousValue: existingInvoice.status,
        newValue: status,
      });
    }

    if (dueDate && new Date(dueDate).toISOString() !== existingInvoice.dueDate.toISOString()) {
      auditLogs.push({
        invoiceId,
        fieldChanged: "dueDate",
        previousValue: existingInvoice.dueDate.toISOString(),
        newValue: new Date(dueDate).toISOString(),
      });
    }

    if (description !== undefined && description !== existingInvoice.description) {
      auditLogs.push({
        invoiceId,
        fieldChanged: "description",
        previousValue: existingInvoice.description || "",
        newValue: description || "",
      });
    }

    if (externalId !== undefined && externalId !== existingInvoice.externalId) {
      auditLogs.push({
        invoiceId,
        fieldChanged: "externalId",
        previousValue: existingInvoice.externalId || "",
        newValue: externalId || "",
      });
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        externalId,
        amount: amount !== undefined ? Number.parseFloat(amount.toString()) : undefined,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        description,
      },
    });

    // Create audit logs
    if (auditLogs.length > 0) {
      await prisma.invoiceAuditLog.createMany({
        data: auditLogs,
      });
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const invoiceId = id;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Delete invoice (this will cascade delete audit logs)
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
