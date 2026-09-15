import { Suspense } from "react";
import Payment from "@/components/Payment";

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Payment />
    </Suspense>
  );
}