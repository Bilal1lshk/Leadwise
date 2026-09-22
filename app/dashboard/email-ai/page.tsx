import { Suspense } from "react";
import EmailAIComposer from "./EmailAIComposer";

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF3C8]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5CB90] border-t-[#458393]" />
    </div>
  );
}

export default function EmailAIPage() {
  return (
    <Suspense fallback={<Loader />}>
      <EmailAIComposer />
    </Suspense>
  );
}