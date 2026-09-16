import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Payment from "@/models/paymentModel";

export async function POST(req) {
  try {
    await connectToDB();

    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const data = event?.data;
    // Normalize: lowercase aur colon ko dot se replace, taaki "PAYMENT:CREATED" 
    // aur "payment.created" dono ek jaise treat ho
    const eventType = (data?.type || "").toLowerCase().replace(/:/g, ".");
    const state = (data?.notification?.state || "").toUpperCase();
    const orderId = data?.notification?.metadata?.order_id;

    console.log("[Webhook] RAW EVENT:", JSON.stringify(event, null, 2));
    console.log("[Webhook] Normalized type:", eventType, "| State:", state, "| OrderId:", orderId);

    if (!orderId) {
      console.log("[Webhook] No orderId found, skipping");
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Success ke saare possible signals
    const isPaid =
      eventType === "payment.succeeded" ||
      state === "PAID" ||
      state === "SUCCEEDED";

    // Failure ke saare possible signals
    const isFailed =
      eventType === "payment.failed" ||
      eventType === "error.occurred" ||
      state === "FAILED";

    // Order create hone ka event — koi status change nahi, bas log karo
    const isCreated = eventType === "payment.created";

    if (isPaid) {
      const updated = await Payment.findOneAndUpdate(
        { orderId },
        { status: "paid" },
        { new: true }
      );
      console.log("[Webhook] Marked PAID:", orderId, "| Updated doc:", !!updated);
    } else if (isFailed) {
      const updated = await Payment.findOneAndUpdate(
        { orderId },
        { status: "failed" },
        { new: true }
      );
      console.log("[Webhook] Marked FAILED:", orderId, "| Updated doc:", !!updated);
    } else if (isCreated) {
      console.log("[Webhook] Payment created (order placed), no status change:", orderId);
    } else {
      console.log("[Webhook] Unhandled event type:", eventType, "| Full state:", state);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}