import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";

interface PlatformSettings {
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  adminEmail: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
}

interface CommissionSettings {
  defaultCommissionRate: number;
  technicianCreditRate: number;
  minimumOrderValue: number;
  maximumOrderValue: number;
  autoApproveOrders: boolean;
  requireOrderApproval: boolean;
}

interface SecuritySettings {
  requireTwoFactor: boolean;
  sessionTimeout: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

interface SettingsResponse {
  success: boolean;
  data?: {
    platform: PlatformSettings;
    commission: CommissionSettings;
    security: SecuritySettings;
  };
  error?: string;
  code?: string;
}

export async function GET(req: Request) {
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
      // if (decoded.role !== "admin") {
      //   return NextResponse.json(
      //     { success: false, error: "Admin access required", code: "FORBIDDEN" },
      //     { status: 403 }
      //   );
      // }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const [rows] = await pool.query(
      `SELECT category, key_name, value FROM settings`
    );

    const settings: {
      platform: PlatformSettings;
      commission: CommissionSettings;
      security: SecuritySettings;
    } = {
      platform: {
        platformName: "TruXtoK",
        platformDescription: "Stock Smarter. Profit Harder.",
        supportEmail: "support@truxtok.com",
        adminEmail: "admin@truxtok.com",
        maintenanceMode: false,
        allowRegistrations: true,
      },
      commission: {
        defaultCommissionRate: 3.0,
        technicianCreditRate: 25.0,
        minimumOrderValue: 10.0,
        maximumOrderValue: 10000.0,
        autoApproveOrders: true,
        requireOrderApproval: false,
      },
      security: {
        requireTwoFactor: false,
        sessionTimeout: 24,
        passwordMinLength: 8,
        requireSpecialChars: true,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
      },
    };

    (rows as any[]).forEach((row) => {
      const value = (row.value);
      if (row.category === "platform") {
        settings.platform[row.key_name as keyof PlatformSettings] = value;
      } else if (row.category === "commission") {
        settings.commission[row.key_name as keyof CommissionSettings] = value;
      } else if (row.category === "security") {
        settings.security[row.key_name as keyof SecuritySettings] = value;
      }
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to fetch settings",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
      // if (decoded.role !== "admin") {
      //   return NextResponse.json(
      //     { success: false, error: "Admin access required", code: "FORBIDDEN" },
      //     { status: 403 }
      //   );
      // }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { category, settings } = body;

    if (
      !["platform", "commission", "security"].includes(category) ||
      !settings
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category or settings",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    // Validate settings based on category
    if (category === "platform") {
      const {
        platformName,
        platformDescription,
        supportEmail,
        adminEmail,
        maintenanceMode,
        allowRegistrations,
      } = settings;
      if (
        !platformName ||
        !platformDescription ||
        !supportEmail ||
        !adminEmail
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required platform fields",
            code: "BAD_REQUEST",
          },
          { status: 400 }
        );
      }
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email format",
            code: "BAD_REQUEST",
          },
          { status: 400 }
        );
      }
    } else if (category === "commission") {
      const {
        defaultCommissionRate,
        technicianCreditRate,
        minimumOrderValue,
        maximumOrderValue,
      } = settings;
      if (
        !Number.isFinite(defaultCommissionRate) ||
        !Number.isFinite(technicianCreditRate) ||
        !Number.isFinite(minimumOrderValue) ||
        !Number.isFinite(maximumOrderValue) ||
        defaultCommissionRate < 0 ||
        defaultCommissionRate > 100 ||
        technicianCreditRate < 0 ||
        technicianCreditRate > 100 ||
        minimumOrderValue < 0 ||
        maximumOrderValue < minimumOrderValue
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid commission settings",
            code: "BAD_REQUEST",
          },
          { status: 400 }
        );
      }
    } else if (category === "security") {
      const {
        sessionTimeout,
        passwordMinLength,
        maxLoginAttempts,
        lockoutDuration,
      } = settings;
      if (
        !Number.isFinite(sessionTimeout) ||
        !Number.isFinite(passwordMinLength) ||
        !Number.isFinite(maxLoginAttempts) ||
        !Number.isFinite(lockoutDuration) ||
        sessionTimeout < 1 ||
        passwordMinLength < 6 ||
        maxLoginAttempts < 1 ||
        lockoutDuration < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid security settings",
            code: "BAD_REQUEST",
          },
          { status: 400 }
        );
      }
    }

    // Save settings to database
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `
        INSERT INTO settings (id, category, key_name, value, updated_at)
        VALUES (UUID(), ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE value = ?, updated_at = NOW()
        `,
        [category, key, JSON.stringify(value), JSON.stringify(value)]
      );
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Settings POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to update settings",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
