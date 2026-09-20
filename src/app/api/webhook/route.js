import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Payment from "@/models/paymentModel";
import crypto from "crypto";

export async function POST(req) {
  try {
    await connectToDB();

    // Read the raw request body before parsing JSON.
    const rawBody = await req.text();

    // Read SafePay webhook security headers.
    const timestamp = req.headers.get("x-sfpy-timestamp");
    const signature = req.headers.get("x-sfpy-signature");

    if (!timestamp || !signature) {
      console.log("[Webhook] Missing signature headers");

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

    // Prevent replay attacks by rejecting old webhook requests.
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = Number(timestamp);

    if (
      !Number.isFinite(webhookTime) ||
      Math.abs(currentTime - webhookTime) > 5 * 60
    ) {
      console.log("[Webhook] Webhook timestamp is too old or invalid");

      return NextResponse.json(
        { error: "Invalid webhook timestamp" },
        { status: 401 }
      );
    }

    // SafePay signs the timestamp and raw request body together.
    const signedPayload = `${timestamp}.${rawBody}`;

    // Decode the base64 webhook secret before creating the HMAC.
    const secret = Buffer.from(webhookSecret, "base64");

    const expectedSignature =
      "sha256=" +
      crypto
        .createHmac("sha256", secret)
        .update(signedPayload)
        .digest("hex");

    // Compare signatures using a timing-safe comparison.
    const receivedSignature = Buffer.from(signature);
    const calculatedSignature = Buffer.from(expectedSignature);

    const signatureValid =
      receivedSignature.length === calculatedSignature.length &&
      crypto.timingSafeEqual(receivedSignature, calculatedSignature);

    if (!signatureValid) {
      console.log("[Webhook] Invalid webhook signature");

      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    console.log("[Webhook] Signature verified successfully");

    // Parse the verified raw body into a JavaScript object.
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