import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Payment from "@/models/paymentModel";

export async function GET(req, { params }) {
  try {
    await connectToDB();

    const { orderId } = await params;

    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ status: payment.status });
  } catch (error) {
    console.error("Order status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}