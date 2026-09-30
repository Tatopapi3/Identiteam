import { useState } from "react";
import { useCapsule } from "../../state/CapsuleContext";
import { SEAL_DURATIONS, formatDate, reopenDate } from "../../state/capsule";
import { Button } from "../ui/Button";
import { CapsuleOrb } from "../ui/CapsuleOrb";
import { PageShell } from "../ui/PageShell";
import { ArrowRightIcon } from "../ui/icons";

export function SealCapsule() {
  const { activeCapsule, updateActiveCapsule, setFlowStep } = useCapsule();
  const [selectedDays, setSelectedDays] = useState(30);

  if (!activeCapsule) return null;
  const sealed = activeCapsule.sealed;

  function handleSeal() {
    const reopenAt = reopenDate(activeCapsule!.createdAt, selectedDays);
    updateActiveCapsule({ sealDurationDays: selectedDays, reopenAt, sealed: true });
  }

  return (
    <PageShell eyebrow={sealed ? "Sealed" : "Seal Your Capsule"}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <CapsuleOrb state={sealed ? "sealed" : "idle"} size={200} />

        {!sealed ? (
          <>
            <h1 className="mt-10 font-display text-4xl text-ink drift-up">
              How long should this wait?
            </h1>
            <p className="mt-3 max-w-md text-muted drift-up">
              Choose when you'll meet this version of yourself again.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 drift-up">
              {SEAL_DURATIONS.map((d) => (
                <button
                  key={d.days}
                  onClick={() => setSelectedDays(d.days)}
                  className={`rounded-2xl border px-5 py-4 font-display text-lg transition-all ${
                    selectedDays === d.days
                      ? "border-gold bg-gold/10 text-gold-bright shadow-[0_0_30px_-8px_rgba(232,182,84,0.5)]"
                      : "border-border text-muted hover:border-border-bright hover:text-ink"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="mt-10 drift-up">
              <Button size="lg" icon={<ArrowRightIcon />} onClick={handleSeal}>
                Seal the Capsule
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-10 font-display text-4xl text-gold-bright drift-up">
              Your capsule is sealed.
            </h1>
            <p className="mt-4 text-muted drift-up">It will reopen on</p>
            <p className="mt-1 font-display text-2xl text-ink drift-up">
              {formatDate(activeCapsule.reopenAt)}
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 drift-up">
              <Button size="lg" icon={<ArrowRightIcon />} onClick={() => setFlowStep("opening")}>
                Try Demo Mode — Open It Now
              </Button>
              <Button variant="ghost" onClick={() => setFlowStep("landing")}>
                Return to Start
              </Button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
