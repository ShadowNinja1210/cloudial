import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    const [invoices, totalInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    const totalPages = Math.ceil(totalInvoices / limit);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        totalInvoices,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, externalId, amount, status, dueDate, description } = await req.json();

    if (!customerId || !amount || !dueDate) {
      return NextResponse.json({ error: "Customer ID, amount, and due date are required" }, { status: 400 });
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check if invoice with externalId already exists for this customer
    if (externalId) {
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          customerId,
          externalId,
        },
      });

      if (existingInvoice) {
        return NextResponse.json(
          { error: "Invoice with this external ID already exists for this customer" },
          { status: 400 }
        );
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        customerId,
        externalId,
        amount: Number.parseFloat(amount.toString()),
        status: status || "PENDING",
        dueDate: new Date(dueDate),
        description,
      },
    });

    // Create audit log entry for invoice creation
    await prisma.invoiceAuditLog.create({
      data: {
        invoiceId: invoice.id,
        fieldChanged: "creation",
        previousValue: "",
        newValue: "Invoice created",
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
