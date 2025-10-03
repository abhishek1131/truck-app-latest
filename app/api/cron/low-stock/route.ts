import { NextRequest, NextResponse } from "next/server";
import { sendLowStockEmail } from "@/lib/email/low-stock";

export async function GET(request: NextRequest) {
  try {
    console.log('📧 Cron job calling low stock email check api ...');
    const result = await sendLowStockEmail();
    
    return NextResponse.json({
      success: true,
      message: "Low stock email check completed",
      result: result
    });
  } catch (error) {
    console.error('❌ Error in cron low stock email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
