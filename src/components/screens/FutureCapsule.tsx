import { useState } from "react";
import { useCapsule } from "../../state/CapsuleContext";
import { daysRemaining, formatDate } from "../../state/capsule";
import { Button } from "../ui/Button";
import { CapsuleOrb } from "../ui/CapsuleOrb";
import { PageShell } from "../ui/PageShell";
import { ArrowRightIcon } from "../ui/icons";

export function FutureCapsule() {
  const { activeCapsule, updateActiveCapsule, setFlowStep } = useCapsule();
  const [phase, setPhase] = useState<"waiting" | "opening" | "opened">("waiting");

  if (!activeCapsule) return null;
  const remaining = daysRemaining(activeCapsule.reopenAt);

  function handleOpen() {
    setPhase("opening");
    window.setTimeout(() => {
      setPhase("opened");
      updateActiveCapsule({ opened: true });
    }, 1400);
  }

  return (
    <PageShell eyebrow="Your Future Capsule">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <CapsuleOrb
          state={phase === "opening" ? "opening" : phase === "opened" ? "open" : "sealed"}
          size={200}
        />

        {phase === "waiting" && (
          <>
            <h1 className="mt-10 font-display text-3xl text-ink drift-up">
              This capsule reopens on
            </h1>
            <p className="mt-2 font-display text-2xl text-gold-bright drift-up">
              {formatDate(activeCapsule.reopenAt)}
            </p>
            <p className="mt-2 font-mono text-sm text-muted drift-up">
              {remaining > 0 ? `${remaining} day${remaining === 1 ? "" : "s"} remaining` : "Ready to open"}
            </p>

            <div className="mt-10 rounded-2xl border border-dashed border-border-bright bg-midnight-2/60 px-6 py-5 drift-up">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold-dim">
                Demo Mode
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted">
                For this demo, you don't have to wait. Open the capsule right now and meet who you
                were.
              </p>
              <div className="mt-5">
                <Button icon={<ArrowRightIcon />} onClick={handleOpen}>
                  Open It Now
                </Button>
              </div>
            </div>
          </>
        )}

        {phase === "opening" && (
          <h1 className="mt-10 font-display text-3xl text-gold-bright glow-breathe">
            Unsealing…
          </h1>
        )}

        {phase === "opened" && (
          <>
            <h1 className="mt-10 font-display text-4xl text-gold-bright drift-up">
              Welcome back, Future You.
            </h1>
            <p className="mt-4 max-w-md text-muted drift-up">
              {activeCapsule.answers.name || "You"} sealed this on{" "}
              {formatDate(activeCapsule.createdAt)}. It's time to hear from them.
            </p>
            <div className="mt-10 drift-up">
              <Button size="lg" icon={<ArrowRightIcon />} onClick={() => setFlowStep("chat")}>
                Talk to Me From the Past
              </Button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
