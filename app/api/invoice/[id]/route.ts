import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";
import { jsPDF } from "jspdf";

interface Order {
  id: string;
  technician: string;
  truck_id: string;
  truck_number: string;
  status: string;
  priority: string; // Changed from urgency to match orders table
  total_amount: number; // Changed from total_cost
  commission_amount: number; // Changed from total_commission
  total_credit: number; // Aggregated from credits table
  created_at: string;
  items: {
    id: string;
    part_name: string;
    part_number: string;
    bin_code: string;
    quantity: number;
    unit_price: number; // Changed from unit_cost to match order_items table
    total_price: number; // Changed from total_cost to match order_items table
    category: string;
    description: string;
  }[];
}

interface InvoiceResponse {
  success: boolean;
  error?: string;
  code?: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to resolve the dynamic route parameter
    const { id } = await params;
    console.log(`Generating invoice for order ID: ${id}`);

    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No or invalid authorization header");
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid token",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };
      // if (decoded.role !== "admin") {
      //   console.log(`Forbidden: User role ${decoded.role} is not admin`);
      //   return NextResponse.json(
      //     { success: false, error: "Admin access required", code: "FORBIDDEN" },
      //     { status: 403 }
      //   );
      // }
      console.log(`Authenticated admin user: ${decoded.id}`);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    // Fetch order details
    const [orderRows] = await pool.query(
      `
      SELECT 
        o.id,
        CONCAT(u.first_name, ' ', u.last_name) as technician,
        t.truck_number,
        o.status,
        o.priority,
        o.total_amount,
        o.commission_amount,
        o.created_at,
        oi.id as item_id,
        ii.name as part_name,
        ii.part_number,
        tb.bin_code,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.category,
        oi.description
      FROM orders o
      JOIN users u ON o.technician_id = u.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN inventory_items ii ON oi.item_id = ii.id
      LEFT JOIN truck_bins tb ON oi.bin_id = tb.id
      WHERE o.id = ?
      `,
      [id]
    );

    // Fetch total credit for the order from credits table
    const [creditRows] = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) as total_credit
      FROM credits
      WHERE order_id = ? AND type = 'earned' AND status = 'issued'
      `,
      [id]
    );

    if (!orderRows.length) {
      console.log(`Order not found: ${id}`);
      return NextResponse.json(
        { success: false, error: "Order not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const order: Order = {
      id: orderRows[0].id,
      technician: orderRows[0].technician,
      truck_id: orderRows[0].truck_id,
      truck_number: orderRows[0].truck_number,
      status: orderRows[0].status,
      priority: orderRows[0].priority,
      total_amount: parseFloat(orderRows[0].total_amount || 0),
      commission_amount: parseFloat(orderRows[0].commission_amount || 0),
      total_credit: parseFloat((creditRows as any)[0].total_credit || 0),
      created_at: new Date(orderRows[0].created_at).toISOString().split("T")[0],
      items: [],
    };

    (orderRows as any[]).forEach((row) => {
      if (row.item_id) {
        order.items.push({
          id: row.item_id,
          part_name: row.part_name,
          part_number: row.part_number,
          bin_code: row.bin_code || "N/A",
          quantity: row.quantity,
          unit_price: parseFloat(row.unit_price || 0),
          total_price: parseFloat(row.total_price || 0),
          category: row.category || "N/A",
          description: row.description || "N/A",
        });
      }
    });
    console.log(`Fetched order: #${order.id} with ${order.items.length} items`);

    // Generate PDF with jsPDF
    const doc = new jsPDF();
    let yPosition = 20;

    // PDF content
    doc.setFontSize(20);
    doc.text("TruXtoK Invoice", 105, yPosition, { align: "center" });
    yPosition += 15;

    doc.setFontSize(12);
    doc.text(`Order #${order.id}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Date: ${order.created_at}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Technician: ${order.technician}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Truck: ${order.truck_number}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Status: ${order.status.toUpperCase()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Priority: ${order.priority.toUpperCase()}`, 20, yPosition);
    yPosition += 15;

    doc.setFontSize(14);
    doc.text("Order Items", 20, yPosition, { underline: true });
    yPosition += 10;

    doc.setFontSize(10);
    doc.text("Part Name", 20, yPosition);
    doc.text("Part #", 70, yPosition);
    doc.text("Bin", 110, yPosition);
    doc.text("Qty", 140, yPosition);
    doc.text("Unit Price", 160, yPosition);
    doc.text("Total Price", 190, yPosition);
    yPosition += 5;
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    order.items.forEach((item) => {
      doc.text(item.part_name, 20, yPosition);
      doc.text(item.part_number, 70, yPosition);
      doc.text(item.bin_code, 110, yPosition);
      doc.text(item.quantity.toString(), 140, yPosition);
      doc.text(`$${item.unit_price.toFixed(2)}`, 160, yPosition);
      doc.text(`$${item.total_price.toFixed(2)}`, 190, yPosition);
      yPosition += 10;
    });

    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    doc.text(`Total: $${order.total_amount.toFixed(2)}`, 190, yPosition, {
      align: "right",
    });
    yPosition += 10;
    doc.text(
      `Commission: $${order.commission_amount.toFixed(2)}`,
      190,
      yPosition,
      {
        align: "right",
      }
    );
    yPosition += 10;
    doc.text(`Credit: $${order.total_credit.toFixed(2)}`, 190, yPosition, {
      align: "right",
    });
    yPosition += 10;
    doc.text(
      `Net Revenue: $${(order.commission_amount - order.total_credit).toFixed(
        2
      )}`,
      190,
      yPosition,
      { align: "right" }
    );

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    console.log(`PDF generated for order #${order.id}`);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${id}.pdf`,
      },
    });
  } catch (error: any) {
    console.error("Invoice generation error:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to generate invoice",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
