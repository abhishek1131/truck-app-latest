import { NextResponse } from "next/server";
import pool from "@/lib/db";

interface PlatformSettings {
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  adminEmail: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
}

interface SettingsResponse {
  success: boolean;
  data?: PlatformSettings;
  error?: string;
  code?: string;
}

export async function GET(req: Request) {
  try {
    const [rows] = await pool.query(
      `SELECT key_name, value FROM settings WHERE category = 'platform'`
    );

    const settings: PlatformSettings = {
      platformName: "TruXtoK",
      platformDescription: "Stock Smarter. Profit Harder.",
      supportEmail: "support@truxtok.com",
      adminEmail: "admin@truxtok.com",
      maintenanceMode: false,
      allowRegistrations: true,
    };

    (rows as any[]).forEach((row) => {
      const key = row.key_name as keyof PlatformSettings;
      let value = row.value;

      // Parse stringified booleans
      if (key === "maintenanceMode" || key === "allowRegistrations") {
        value = value === "true" || value === true; // Convert to boolean
      }

      settings[key] = value;
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Public Settings GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to fetch platform settings",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
