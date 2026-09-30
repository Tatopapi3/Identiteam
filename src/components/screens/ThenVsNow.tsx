import { useEffect, useState } from "react";
import { useCapsule } from "../../state/CapsuleContext";
import { generateReflection } from "../../lib/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { PageShell } from "../ui/PageShell";
import { CheckIcon, SparkleIcon } from "../ui/icons";

function fallbackReflection(count: number, name: string) {
  return `${name || "You"} sealed a moment, and ${count} thing${
    count === 1 ? " has" : "s have"
  } already changed since then. The capsule remembers who you were — this page is proof you didn't stay there.`;
}

export function ThenVsNow() {
  const { activeCapsule, updateActiveCapsule, startNewCapsule } = useCapsule();
  const [reflection, setReflection] = useState(activeCapsule?.reflection ?? "");
  const [loading, setLoading] = useState(!activeCapsule?.reflection);

  useEffect(() => {
    if (!activeCapsule || activeCapsule.reflection) return;
    let cancelled = false;
    (async () => {
      try {
        const { reflection: text } = await generateReflection({
          answers: activeCapsule.answers,
          snapshot: activeCapsule.snapshot,
          milestones: activeCapsule.milestones ?? [],
        });
        if (cancelled) return;
        setReflection(text);
        updateActiveCapsule({ reflection: text });
      } catch {
        if (cancelled) return;
        const fb = fallbackReflection(
          activeCapsule.milestones?.length ?? 0,
          activeCapsule.answers.name,
        );
        setReflection(fb);
        updateActiveCapsule({ reflection: fb });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCapsule?.id]);

  if (!activeCapsule) return null;
  const { snapshot, milestones = [] } = activeCapsule;

  return (
    <PageShell wide eyebrow="Then vs. Now">
      <div className="flex flex-1 flex-col items-center">
        <h1 className="font-display text-4xl text-ink text-center drift-up">
          Then <span className="text-faint">vs.</span>{" "}
          <span className="text-gold-bright italic">Now</span>
        </h1>

        <div className="mt-10 grid w-full gap-6 sm:grid-cols-2">
          <Card className="border-border/70 p-6 opacity-80 drift-up">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Then</p>
            <dl className="mt-5 space-y-5">
              <Field label="What I Wanted" value={snapshot.goals} />
              <Field label="What I Feared" value={snapshot.worries} />
              <Field label="What Mattered To Me" value={snapshot.whatMatters} />
              <Field label="Who I Wanted To Become" value={snapshot.whoIWantToBecome} />
            </dl>
          </Card>

          <Card className="border-gold/30 bg-midnight-2/90 p-6 shadow-glow drift-up [animation-delay:0.1s]">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold-dim">Now</p>
            <p className="mt-5 mb-2 text-sm font-semibold text-ink">What I Accomplished</p>
            {milestones.length > 0 ? (
              <ul className="space-y-2.5">
                {milestones.map((m, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[15px] text-ink">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gold/20 text-gold">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No milestones recorded yet.</p>
            )}
          </Card>
        </div>

        <Card className="mt-6 w-full p-7 text-center drift-up [animation-delay:0.2s]">
          <div className="mb-3 flex items-center justify-center gap-2 text-gold">
            <SparkleIcon className="h-4 w-4" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold-dim">
              Look How Far You've Come
            </p>
          </div>
          <p className="mx-auto max-w-2xl font-display text-lg italic leading-relaxed text-ink">
            {loading ? "Weighing who you were against who you've become…" : reflection}
          </p>
        </Card>

        <div className="mt-12 text-center drift-up">
          <p className="font-display text-2xl text-ink">You're not finished becoming.</p>
          <div className="mt-6">
            <Button size="lg" onClick={startNewCapsule}>
              Create Another Time Capsule
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-1 text-[15px] leading-relaxed text-muted">{value}</dd>
    </div>
  );
}
