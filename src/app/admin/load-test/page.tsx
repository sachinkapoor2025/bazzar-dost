import { LoadCheck } from "@/components/load-check";

export default function LoadTestPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Load Test</h1>
      <p className="mb-4 mt-2 max-w-3xl text-sm leading-6 text-muted">This checks the home page, shop, and search on this server, one request at a time. It reports status and response time for the sample you choose.</p>
      <LoadCheck />
    </div>
  );
}
