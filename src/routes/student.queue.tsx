import { createFileRoute } from "@tanstack/react-router";
import { Info, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel } from "@/components/med/ui";
import { TokenCard } from "@/components/med/TokenCard";
import { AVG_CONSULT_MIN, activeToken, generateToken, useStore } from "@/lib/store";

export const Route = createFileRoute("/student/queue")({
  head: () => ({ meta: [{ title: "Queue — MedQueue Student" }, { name: "description", content: "Your virtual token and live queue position." }, { property: "og:title", content: "Queue — MedQueue Student" }, { property: "og:description", content: "Your virtual token and live queue position." }] }),
  component: QueuePage,
});

function QueuePage() {
  const s = useStore((s) => s);
  const token = activeToken(s);
  const waiting = s.queue.filter((q) => q.status === "waiting").length;
  const gen = () => { const r = generateToken(); r.ok ? toast.success("Token generated") : toast.error(r.error); };
  return (
    <>
      <PageHeader title="Walk-in queue" subtitle="Join the queue virtually and wait wherever you like." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {token ? <TokenCard /> : (
          <Panel title="Your token">
            <EmptyState icon={Ticket} title="You’re not in the queue" text={`${waiting} people are waiting. Average consultation is about ${AVG_CONSULT_MIN} minutes.`}
              action={<Button variant="teal" size="lg" onClick={gen}><Ticket />Generate token</Button>} />
          </Panel>
        )}
        <Panel title="How it works">
          {token && (
            <p className="mb-4 flex gap-2 rounded-lg bg-info/10 p-3 text-sm text-info"><Info className="size-4 shrink-0 translate-y-0.5" aria-hidden />You already have an active token. You can generate a new one after it’s completed or cancelled by staff.</p>
          )}
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Generate one token per visit.</li>
            <li>Watch your position and estimated wait update here.</li>
            <li>Head to the clinic when your status changes to “in consultation”.</li>
          </ol>
        </Panel>
      </div>
    </>
  );
}
