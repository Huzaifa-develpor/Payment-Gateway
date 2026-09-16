import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Payment from "@/models/paymentModel";

export async function POST(req) {
  try {
    await connectToDB();

    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const data = event?.data;
    const eventType = data?.type?.toLowerCase(); 
    const state = data?.notification?.state;
    const orderId = data?.notification?.metadata?.order_id;

    console.log("[Webhook] RAW EVENT:", JSON.stringify(event, null, 2));
    console.log("[Webhook] Event type:", eventType, "| State:", state, "| OrderId:", orderId);

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const isPaid = eventType === "payment.succeeded" || state === "PAID";
    const isFailed = eventType === "payment.failed" || state === "FAILED";

    if (isPaid) {
      await Payment.findOneAndUpdate({ orderId }, { status: "paid" }, { new: true });
      console.log("[Webhook] Marked as PAID:", orderId);
    } else if (isFailed) {
      await Payment.findOneAndUpdate({ orderId }, { status: "failed" }, { new: true });
      console.log("[Webhook] Marked as FAILED:", orderId);
    } else {
      console.log("[Webhook] Unhandled event, no DB update. Full type was:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}