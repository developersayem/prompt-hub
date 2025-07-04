export const dynamic = "force-dynamic";
import { Suspense } from "react";
import VerifyCodeCom from "./verify-code-com";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <VerifyCodeCom />
    </Suspense>
  );
}
