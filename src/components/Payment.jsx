"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentContent() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get("order_id");

  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000 }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(false);
    }
  };

  const checkStatus = useCallback(async (orderId) => {
    try {
      const res = await fetch(`/api/order-status/${orderId}`);
      const data = await res.json();

      if (data.status) setStatus(data.status);

      return data.status;
    } catch (err) {
      console.error("Status check error:", err);
    }
  }, []);

  useEffect(() => {
    if (!orderIdFromUrl) return;

    const interval = setInterval(async () => {
      const current = await checkStatus(orderIdFromUrl);

      if (current === "paid" || current === "failed") {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [orderIdFromUrl, checkStatus]);

  return (
    <div className="min-h-screen w-full bg-[#F6F3EC] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#FFFFFF] rounded-[28px] shadow-[0_20px_60px_-15px_rgba(30,58,45,0.25)] border border-[#E4DDCB] overflow-hidden">
        <div className="bg-[#1E3A2D] px-8 pt-10 pb-8 relative">
          <p className="text-[#C9A24B] text-sm tracking-wide font-medium mb-1">
            Checkout
          </p>

          <h1
            className="text-[#F6F3EC] text-3xl leading-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Test Premium Plan
          </h1>

          <p className="text-[#BFCABE] text-sm mt-2 max-w-[80%]">
            Full access, billed monthly. Cancel anytime.
          </p>
        </div>

        <div className="px-8 py-8">
          <div className="flex items-end justify-between border-b border-[#E4DDCB] pb-6 mb-6">
            <span className="text-[#6B6355] text-sm">Amount due</span>

            <span
              className="text-[#1E3A2D] text-4xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Rs. 1,000
            </span>
          </div>

          <button
            onClick={handlePay}
            disabled={loading || status === "paid"}
            className="w-full bg-[#1E3A2D] hover:bg-[#16302A] text-[#F6F3EC] rounded-full py-4 text-base font-medium transition-colors duration-200 disabled:opacity-60"
          >
            {loading
              ? "Redirecting..."
              : status === "paid"
              ? "Paid"
              : "Pay now"}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "pending"
                  ? "bg-[#C9A24B]"
                  : status === "paid"
                  ? "bg-[#1E3A2D]"
                  : "bg-red-500"
              }`}
            />

            <span className="text-[#6B6355] text-sm">
              {status === "pending"
                ? "Payment pending"
                : status === "paid"
                ? "Payment received"
                : "Payment failed"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Payment() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}