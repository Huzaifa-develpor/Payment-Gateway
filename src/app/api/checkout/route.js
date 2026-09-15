// app/api/checkout/route.js
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
  cancelUrl: `http://localhost:3000/payment?cancelled=true`,
  redirectUrl: `http://localhost:3000/payment`,   
  source: "custom",
  webhooks: true,
});

  await Payment.create({ orderId, token, amount, status: "pending" });

  return NextResponse.json({ url: checkoutUrl, orderId });
}