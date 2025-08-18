import { Suspense } from "react";
import VerifyClient from "../_components/verify-client";

export default function VerifyPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center">Chargement...</p>}>
      <VerifyClient />
    </Suspense>
  );
}
