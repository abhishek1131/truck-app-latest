import { NextRequest, NextResponse } from "next/server";
import { sendRestockEmail } from "@/lib/email/restock";

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Cron job calling restock email check...');
    const result = await sendRestockEmail();
    
    return NextResponse.json({
      success: true,
      message: "Restock email check completed",
      result: result
    });
  } catch (error) {
    console.error('❌ Error in cron restock email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
