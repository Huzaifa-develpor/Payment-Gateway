import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { safepay } from "@/lib/safepay";
import Payment from "@/models/paymentModel";

export async function POST(req) {
  await connectToDB();

  const { amount } = await req.json();
  const orderId = `ORDER-${Date.now()}`;

  const { token } = await safepay.payments.create({
    amount,
    currency: "PKR",
  });

  const checkoutUrl = safepay.checkout.create({
    token,
    orderId,
    cancelUrl:
      "https://payment-gateway-haip5nx45-muhammad-huzaifa-s-devprojects1.vercel.app/payment?cancelled=true",
    redirectUrl:
      "https://payment-gateway-haip5nx45-muhammad-huzaifa-s-devprojects1.vercel.app/payment",
    source: "custom",
    webhooks: true,
  });
  console.log(" SAFE PAY CHECKOUT URL:", checkoutUrl);
  await Payment.create({
    orderId,
    token,
    amount,
    status: "pending",
  });

  return NextResponse.json({ url: checkoutUrl, orderId });
}