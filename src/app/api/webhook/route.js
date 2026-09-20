import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { safepay } from "@/lib/safepay";
import Payment from "@/models/paymentModel";

export async function POST(req) {
  try {
    await connectToDB();

    // Verify that the webhook was sent by SafePay.
    const isValid = await safepay.verify.webhook(req);

    if (!isValid) {
      console.log("[Webhook] Invalid webhook signature");

      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    console.log("[Webhook] Signature verified successfully");

    // Read the raw request body after signature verification.
    const rawBody = await req.text();

    // Parse the verified webhook body.
    const event = JSON.parse(rawBody);

    const data = event?.data;

    // Normalize event type for consistent comparison.
    const eventType = (data?.type || "").toLowerCase().replace(/:/g, ".");

    const state = (data?.notification?.state || "").toUpperCase();

    const orderId = data?.notification?.metadata?.order_id;

    console.log("[Webhook] RAW EVENT:", JSON.stringify(event, null, 2));

    console.log(
      "[Webhook] Normalized type:",
      eventType,
      "| State:",
      state,
      "| OrderId:",
      orderId
    );

    if (!orderId) {
      console.log("[Webhook] No orderId found, skipping");

      return NextResponse.json(
        { error: "Missing orderId" },
        { status: 400 }
      );
    }

    // Check all supported payment success signals.
    const isPaid =
      eventType === "payment.succeeded" ||
      state === "PAID" ||
      state === "SUCCEEDED";

    // Check all supported payment failure signals.
    const isFailed =
      eventType === "payment.failed" ||
      eventType === "error.occurred" ||
      state === "FAILED";

    // Payment creation does not change the payment status.
    const isCreated = eventType === "payment.created";

    if (isPaid) {
      const updated = await Payment.findOneAndUpdate(
        { orderId },
        { status: "paid" },
        { new: true }
      );

      console.log(
        "[Webhook] Marked PAID:",
        orderId,
        "| Updated doc:",
        !!updated
      );
    } else if (isFailed) {
      const updated = await Payment.findOneAndUpdate(
        { orderId },
        { status: "failed" },
        { new: true }
      );

      console.log(
        "[Webhook] Marked FAILED:",
        orderId,
        "| Updated doc:",
        !!updated
      );
    } else if (isCreated) {
      console.log(
        "[Webhook] Payment created (order placed), no status change:",
        orderId
      );
    } else {
      console.log(
        "[Webhook] Unhandled event type:",
        eventType,
        "| Full state:",
        state
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}