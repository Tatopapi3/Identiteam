import { useState } from "react";
import { useCapsule } from "../../state/CapsuleContext";
import { extractMilestones } from "../../lib/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { PageShell } from "../ui/PageShell";
import { VoiceAnswerField } from "../ui/VoiceAnswerField";
import { ArrowRightIcon, CheckIcon, SparkleIcon } from "../ui/icons";

function fallbackMilestones(text: string): string[] {
  return text
    .split(/[.,;]|(?:\band\b)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .slice(0, 6);
}

export function MilestoneCheckIn() {
  const { activeCapsule, updateActiveCapsule, setFlowStep } = useCapsule();
  const [response, setResponse] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [milestones, setMilestones] = useState<string[] | null>(
    activeCapsule?.milestones ?? null,
  );

  if (!activeCapsule) return null;

  async function handleExtract() {
    setIsExtracting(true);
    let result: string[];
    try {
      const res = await extractMilestones(response);
      result = res.milestones;
    } catch {
      result = fallbackMilestones(response);
    }
    setMilestones(result);
    updateActiveCapsule({ milestones: result });
    setIsExtracting(false);
  }

  return (
    <PageShell eyebrow="Milestone Check-In">
      <div className="flex flex-1 flex-col items-center justify-center">
        {!milestones ? (
          <div className="w-full max-w-lg text-center drift-up">
            <h1 className="font-display text-4xl text-ink">So… what happened?</h1>
            <p className="mt-3 text-muted">
              Tell your past self what you've done since sealing this capsule.
            </p>
            <div className="mt-8 text-left">
              <VoiceAnswerField
                value={response}
                onChange={setResponse}
                placeholder="I got my first AI job, finished two projects, and started exercising regularly…"
                rows={5}
              />
            </div>
            <div className="mt-8">
              <Button
                size="lg"
                icon={<SparkleIcon />}
                disabled={!response.trim() || isExtracting}
                onClick={handleExtract}
              >
                {isExtracting ? "Finding your milestones…" : "Extract My Milestones"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg text-center drift-up">
            <h1 className="font-display text-4xl text-gold-bright">Your Milestones</h1>
            <Card className="mt-8 p-6 text-left">
              <ul className="space-y-3">
                {milestones.map((m, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] text-ink">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gold/15 text-gold">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            </Card>
            <div className="mt-8">
              <Button size="lg" icon={<ArrowRightIcon />} onClick={() => setFlowStep("compare")}>
                See Then vs. Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
