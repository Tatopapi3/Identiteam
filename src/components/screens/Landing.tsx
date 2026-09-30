import { useCapsule } from "../../state/CapsuleContext";
import { formatDate } from "../../state/capsule";
import { Button } from "../ui/Button";
import { CapsuleOrb } from "../ui/CapsuleOrb";
import { PageShell } from "../ui/PageShell";
import { ArrowRightIcon, HourglassIcon } from "../ui/icons";

export function Landing() {
  const { capsules, startNewCapsule, selectCapsule, setFlowStep } = useCapsule();

  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="drift-up">
          <CapsuleOrb state="idle" size={180} />
        </div>

        <h1 className="mt-10 font-display text-6xl font-medium tracking-tight text-ink drift-up [animation-delay:0.1s]">
          Future <span className="text-gold-bright italic">Me</span>
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted drift-up [animation-delay:0.2s]">
          Capture who you are today. Meet yourself tomorrow.
        </p>

        <div className="mt-10 drift-up [animation-delay:0.3s]">
          <Button size="lg" icon={<ArrowRightIcon />} onClick={startNewCapsule}>
            Create My Time Capsule
          </Button>
        </div>

        {capsules.length > 0 && (
          <div className="mt-16 w-full max-w-md drift-up [animation-delay:0.4s]">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-gold-dim">
              Your capsules
            </p>
            <div className="space-y-2">
              {capsules
                .slice()
                .reverse()
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      selectCapsule(c.id);
                      setFlowStep(c.opened ? "compare" : "sealed");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-midnight-2/60 px-4 py-3 text-left transition-colors hover:border-gold/40"
                  >
                    <span className="text-sm text-ink">
                      {c.answers.name || "Untitled capsule"}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
                      <HourglassIcon className="h-3.5 w-3.5" />
                      {c.opened ? "Opened" : `Opens ${formatDate(c.reopenAt)}`}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
