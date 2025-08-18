import { Suspense } from "react";
import UnsubscribeClient from "../_components/unsubscribe-client";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<p className="p-6 text-center">Chargement...</p>}>
      <UnsubscribeClient />
    </Suspense>
  );
}
