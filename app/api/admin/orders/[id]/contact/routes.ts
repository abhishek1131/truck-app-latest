import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";
import nodemailer from "nodemailer";
import twilio from "twilio";

interface ContactRequest {
  method: "email" | "sms" | "both";
  subject: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
}

interface ContactResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
        return NextResponse.json(
          { success: false, error: "Admin access required", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body: ContactRequest = await req.json();
    const { method, subject, message, priority } = body;

    if (
      !method ||
      !subject ||
      !message ||
      !["email", "sms", "both"].includes(method)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const [orderRows] = await pool.query(
      `
      SELECT u.email, u.phone, CONCAT(u.first_name, ' ', u.last_name) as technician_name
      FROM orders o
      JOIN users u ON o.technician_id = u.id
      WHERE o.id = ?
      `,
      [params.id]
    );

    if (!orderRows[0]) {
      return NextResponse.json(
        {
          success: false,
          error: "Order or technician not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const { email, phone, technician_name } = orderRows[0];

    if (method === "email" || method === "both") {
      if (!email) {
        return NextResponse.json(
          {
            success: false,
            error: "Technician email not available",
            code: "BAD_REQUEST",
          },
          { status: 400 }
        );
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"TruXtoK Admin" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: `[${priority.toUpperCase()}] ${subject}`,
        text: `Dear ${technician_name},\n\n${message}\n\nOrder ID: ${params.id}\n\nBest regards,\nTruXtoK Admin Team`,
        html: `
          <p>Dear ${technician_name},</p>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <p><strong>Order ID:</strong> ${params.id}</p>
          <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
          <p>Best regards,<br>TruXtoK Admin Team</p>
        `,
      });
    }

    if (method === "sms" || method === "both") {
      if (!phone) {
        return NextResponse.json(
          {
            success: false,
            error: "Technician phone not available",
            code: "BAD_REQUEST",
          },
          { status: 400 }
        );
      }

      const twilioClient = twilio(
        process.env.TWILIO_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await twilioClient.messages.create({
        body: `[${priority.toUpperCase()}] ${subject}\n${message}\nOrder ID: ${
          params.id
        }`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error: any) {
    console.error("Contact technician error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send message",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
