import { useCapsule } from "../../state/CapsuleContext";
import type { IdentitySnapshot as IdentitySnapshotType } from "../../state/capsule";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { PageShell } from "../ui/PageShell";
import { ArrowRightIcon } from "../ui/icons";

const FIELDS: { key: keyof IdentitySnapshotType; label: string }[] = [
  { key: "whoIAmNow", label: "Who I Am Right Now" },
  { key: "goals", label: "My Goals" },
  { key: "hopes", label: "My Hopes" },
  { key: "worries", label: "My Worries" },
  { key: "whatMatters", label: "What Matters To Me" },
  { key: "whoIWantToBecome", label: "Who I Want To Become" },
];

export function IdentitySnapshot() {
  const { activeCapsule, setFlowStep } = useCapsule();
  if (!activeCapsule) return null;
  const { snapshot, answers } = activeCapsule;

  return (
    <PageShell wide eyebrow="Your Identity Snapshot">
      <div className="flex flex-1 flex-col items-center">
        <div className="text-center drift-up">
          {answers.photoDataUrl && (
            <img
              src={answers.photoDataUrl}
              alt={answers.name}
              className="mx-auto mb-6 h-24 w-24 rounded-full object-cover border-2 border-gold/50"
            />
          )}
          <h1 className="font-display text-4xl text-ink">
            A snapshot of <span className="italic text-grad">{answers.name || "you"}</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted">
            This is based only on what you just shared — nothing more, nothing assumed.
          </p>
        </div>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label }, i) => (
            <Card
              key={key}
              className="p-6 drift-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-gold-dim">
                {label}
              </p>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink/90">
                {snapshot[key]}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-12 drift-up">
          <Button size="lg" icon={<ArrowRightIcon />} onClick={() => setFlowStep("seal")}>
            Seal This Moment
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
