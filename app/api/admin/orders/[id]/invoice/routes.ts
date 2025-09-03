import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

interface Order {
  id: string;
  technician: string;
  truck_id: string;
  truck_number: string;
  status: string;
  urgency: string;
  total_cost: number;
  total_commission: number;
  total_credit: number;
  created_at: string;
  items: {
    id: string;
    part_name: string;
    part_number: string;
    bin_code: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
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
      if (decoded.role !== "admin") {
        console.log(`Forbidden: User role ${decoded.role} is not admin`);
        return NextResponse.json(
          { success: false, error: "Admin access required", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
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
        o.urgency,
        o.total_cost,
        o.total_commission,
        o.total_credit,
        o.created_at,
        oi.id as item_id,
        ii.name as part_name,
        ii.part_number,
        tb.bin_code,
        oi.quantity,
        oi.unit_cost,
        oi.total_cost,
        ii.category,
        ii.description
      FROM orders o
      JOIN users u ON o.technician_id = u.id
      JOIN trucks t ON o.truck_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN inventory_items ii ON oi.inventory_item_id = ii.id
      LEFT JOIN truck_bins tb ON oi.bin_id = tb.id
      WHERE o.id = ?
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
      urgency: orderRows[0].urgency,
      total_cost: parseFloat(orderRows[0].total_cost || 0),
      total_commission: parseFloat(orderRows[0].total_commission || 0),
      total_credit: parseFloat(orderRows[0].total_credit || 0),
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
          unit_cost: parseFloat(row.unit_cost || 0),
          total_cost: parseFloat(row.total_cost || 0),
          category: row.category || "N/A",
          description: row.description || "N/A",
        });
      }
    });
    console.log(`Fetched order: #${order.id} with ${order.items.length} items`);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    const stream = new Readable({
      read() {},
    });

    doc.on("data", (buffer) => buffers.push(buffer));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      stream.push(pdfData);
      stream.push(null);
      console.log(`PDF generated for order #${order.id}`);
    });

    // PDF content
    doc.fontSize(20).text("TruXtoK Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Order #${order.id}`, { align: "left" });
    doc.text(`Date: ${order.created_at}`, { align: "left" });
    doc.text(`Technician: ${order.technician}`, { align: "left" });
    doc.text(`Truck: ${order.truck_number}`, { align: "left" });
    doc.text(`Status: ${order.status.toUpperCase()}`, { align: "left" });
    doc.text(`Urgency: ${order.urgency.toUpperCase()}`, { align: "left" });
    doc.moveDown();

    doc.fontSize(14).text("Order Items", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10);
    doc.text("Part Name", 50, doc.y, { continued: true });
    doc.text("Part #", 200, doc.y, { continued: true });
    doc.text("Bin", 300, doc.y, { continued: true });
    doc.text("Qty", 350, doc.y, { continued: true });
    doc.text("Unit Cost", 400, doc.y, { continued: true });
    doc.text("Total Cost", 480, doc.y);
    doc.moveDown(0.5);
    doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    order.items.forEach((item) => {
      doc.text(item.part_name, 50, doc.y, { continued: true });
      doc.text(item.part_number, 200, doc.y, { continued: true });
      doc.text(item.bin_code, 300, doc.y, { continued: true });
      doc.text(item.quantity.toString(), 350, doc.y, { continued: true });
      doc.text(`$${item.unit_cost.toFixed(2)}`, 400, doc.y, {
        continued: true,
      });
      doc.text(`$${item.total_cost.toFixed(2)}`, 480, doc.y);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.text(`Total: $${order.total_cost.toFixed(2)}`, 480, doc.y);
    doc.text(`Commission: $${order.total_commission.toFixed(2)}`, 480, doc.y);
    doc.text(`Credit: $${order.total_credit.toFixed(2)}`, 480, doc.y);
    doc.text(
      `Net Revenue: $${(order.total_commission - order.total_credit).toFixed(
        2
      )}`,
      480,
      doc.y
    );

    doc.end();
    console.log(`Streaming PDF response for order #${order.id}`);

    return new NextResponse(stream, {
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
