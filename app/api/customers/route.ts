import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface CustomerFromDB {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  externalId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    invoices: number;
  };
  invoices: {
    amount: number;
    status: string;
  }[];
}

// Add interface for the processed customer data
interface CustomerWithTotals {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  externalId: string | null;
  createdAt: Date;
  updatedAt: Date;
  totalAmount: number;
  outstandingAmount: number;
  invoiceCount: number;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [customers, totalCustomers] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { invoices: true },
          },
          invoices: {
            select: {
              amount: true,
              status: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCustomers / limit);

    // Calculate total and outstanding amounts for each customer
    const customersWithTotals: CustomerWithTotals[] = customers.map((customer: CustomerFromDB) => {
      const totalAmount = customer.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const outstandingAmount = customer.invoices
        .filter((invoice) => invoice.status === "PENDING" || invoice.status === "PAST_DUE")
        .reduce((sum, invoice) => sum + invoice.amount, 0);

      const { id, name, email, phone, address, externalId, createdAt, updatedAt } = customer;

      return {
        id,
        name,
        email,
        phone,
        address,
        externalId,
        createdAt,
        updatedAt,
        totalAmount,
        outstandingAmount,
        invoiceCount: customer._count.invoices,
      };
    });

    return NextResponse.json({
      customers: customersWithTotals,
      pagination: {
        page,
        limit,
        totalCustomers,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, address, externalId } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Check if customer with externalId already exists
    if (externalId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { externalId },
      });

      if (existingCustomer) {
        return NextResponse.json({ error: "Customer with this external ID already exists" }, { status: 400 });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        externalId,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
