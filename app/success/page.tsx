"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem("paid_export", "true");
    router.replace("/editor");
  }, [router]);

  return <div>Payment successful...</div>;
}