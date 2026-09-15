import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Payment from "@/models/paymentModel";

export async function POST(req) {
  try {
    await connectToDB();

    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    // ⚠️ TEMP: signature verification skip kiya hai — sandbox/learning ke liye theek hai,
    // production mein jaane se pehle Safepay se exact HMAC algorithm confirm karke wapas add karna hai

    const data = event?.data;
    console.log("[Webhook] Event type:", data?.type);

    const orderId = data?.notification?.metadata?.order_id;
    const state = data?.notification?.state; // "PAID", "FAILED", etc.

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    if (data?.type === "payment:created" && state === "PAID") {
       await Payment.findOneAndUpdate({ orderId }, { status: "paid" }, { new: true });
 
    } else if (state === "FAILED") {
       await Payment.findOneAndUpdate({ orderId }, { status: "failed" }, { new: true });
    } else {
      console.log("[Webhook] Unhandled state:", state);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}