import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Payment from "@/models/paymentModel";
import crypto from "crypto";

export async function POST(req) {
  try {
    await connectToDB();

    // Read the raw request body.
    const rawBody = await req.text();

    // Read the signature sent by SafePay.
    const receivedSignature = req.headers.get("x-sfpy-signature");

    if (!receivedSignature) {
      console.log("[Webhook] Missing SafePay signature");

      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 401 }
      );
    }

    // Get the webhook secret from environment variables.
    const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Webhook] SAFEPAY_WEBHOOK_SECRET is missing");

      return NextResponse.json(
        { error: "Webhook secret is not configured" },
        { status: 500 }
      );
    }

    // Parse the webhook body.
    const event = JSON.parse(rawBody);

    const data = event?.data;

    if (!data) {
      console.log("[Webhook] Missing data object");

      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // SafePay legacy webhooks sign the data object, not the full request body.
    const signedPayload = JSON.stringify(data);

    // Generate the expected SafePay webhook signature.
    const expectedSignature = crypto
      .createHmac("sha512", webhookSecret)
      .update(signedPayload)
      .digest("hex");

    // Compare the signatures securely.
    const receivedBuffer = Buffer.from(receivedSignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    const signatureValid =
      receivedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

    if (!signatureValid) {
      console.log("[Webhook] Invalid webhook signature");

      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Normalize event type for consistent comparison.
    const eventType = (data?.type || "").toLowerCase().replace(/:/g, ".");

    const state = (data?.notification?.state || "").toUpperCase();

    const orderId = data?.notification?.metadata?.order_id;

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
        { returnDocument: "after" }
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
        { returnDocument: "after" }
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