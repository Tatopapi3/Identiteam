import { useState } from "react";
import { useCapsule } from "../../state/CapsuleContext";
import type { Capsule, CapsuleAnswers } from "../../state/capsule";
import { EMPTY_ANSWERS, reopenDate } from "../../state/capsule";
import { generateSnapshot } from "../../lib/api";
import { Button } from "../ui/Button";
import { PageShell } from "../ui/PageShell";
import { VoiceAnswerField } from "../ui/VoiceAnswerField";
import { ArrowRightIcon, CameraIcon, SparkleIcon } from "../ui/icons";

type VoiceQuestion = {
  key: keyof CapsuleAnswers;
  prompt: string;
  placeholder: string;
};

const VOICE_QUESTIONS: VoiceQuestion[] = [
  {
    key: "voiceMessage",
    prompt: "Leave a voice message for your future self.",
    placeholder: "Say whatever feels true right now…",
  },
  {
    key: "workingToward",
    prompt: "What are you working toward right now?",
    placeholder: "A project, a role, a version of yourself…",
  },
  {
    key: "currentGoals",
    prompt: "What are your current goals?",
    placeholder: "Be as concrete or as loose as feels right.",
  },
  {
    key: "worries",
    prompt: "What are you worried about?",
    placeholder: "The thing you don't say out loud often.",
  },
  {
    key: "whatMatters",
    prompt: "What matters most to you right now?",
    placeholder: "The people, values, or work that anchor you.",
  },
  {
    key: "hopesForChange",
    prompt: "What do you hope will be different when this capsule opens?",
    placeholder: "What would change feel like?",
  },
  {
    key: "dearFutureMe",
    prompt: 'Write a message that begins with "Dear Future Me…"',
    placeholder: "Dear Future Me…",
  },
];

const TOTAL_STEPS = 2 + VOICE_QUESTIONS.length;

function fallbackSnapshot(answers: CapsuleAnswers) {
  return {
    whoIAmNow: answers.voiceMessage || answers.dearFutureMe || "Someone mid-story, captured here.",
    goals: answers.currentGoals || answers.workingToward || "—",
    hopes: answers.hopesForChange || "—",
    worries: answers.worries || "—",
    whatMatters: answers.whatMatters || "—",
    whoIWantToBecome: answers.workingToward || "—",
  };
}

export function CreateCapsule() {
  const { createCapsule, setFlowStep } = useCapsule();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CapsuleAnswers>(EMPTY_ANSWERS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNameStep = step === 0;
  const isPhotoStep = step === 1;
  const question = !isNameStep && !isPhotoStep ? VOICE_QUESTIONS[step - 2] : null;

  function patch(fields: Partial<CapsuleAnswers>) {
    setAnswers((prev) => ({ ...prev, ...fields }));
  }

  function canAdvance() {
    if (isNameStep) return answers.name.trim().length > 0;
    return true;
  }

  async function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    setIsSubmitting(true);
    let snapshot;
    try {
      const res = await generateSnapshot(answers);
      snapshot = res.snapshot;
    } catch {
      snapshot = fallbackSnapshot(answers);
    }
    const createdAt = new Date().toISOString();
    const sealDurationDays = 30;
    const capsule: Capsule = {
      id: crypto.randomUUID(),
      createdAt,
      sealDurationDays,
      reopenAt: reopenDate(createdAt, sealDurationDays),
      sealed: false,
      opened: false,
      answers,
      snapshot,
    };
    createCapsule(capsule);
    setIsSubmitting(false);
    setFlowStep("snapshot");
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ photoDataUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <PageShell eyebrow={`Step ${step + 1} of ${TOTAL_STEPS} — Creating your capsule`}>
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 h-1 w-full rounded-full bg-midnight-3">
          <div
            className="h-1 rounded-full bg-gradient-to-r from-gold-dim to-gold-bright transition-all duration-500"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className="drift-up" key={step}>
          {isNameStep && (
            <>
              <h2 className="font-display text-3xl text-ink">Before we begin —</h2>
              <p className="mt-2 text-muted">What should we call you?</p>
              <input
                autoFocus
                value={answers.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Your name"
                className="mt-6 w-full rounded-2xl border border-border bg-midnight-3/70 px-4 py-3 text-lg font-body text-ink placeholder:text-faint focus:border-gold/50 focus:outline-none"
              />
            </>
          )}

          {isPhotoStep && (
            <>
              <h2 className="font-display text-3xl text-ink">A snapshot of you, literally.</h2>
              <p className="mt-2 text-muted">
                Add a photo or selfie — totally optional, but a nice thing to find later.
              </p>
              <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-bright bg-midnight-3/50 py-10 text-muted transition-colors hover:border-gold/50 hover:text-gold-dim">
                {answers.photoDataUrl ? (
                  <img
                    src={answers.photoDataUrl}
                    alt="Your selfie"
                    className="h-32 w-32 rounded-full object-cover border border-gold/40"
                  />
                ) : (
                  <CameraIcon className="h-8 w-8" />
                )}
                <span className="text-sm">
                  {answers.photoDataUrl ? "Change photo" : "Tap to add a photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </>
          )}

          {question && (
            <>
              <h2 className="font-display text-3xl text-ink">{question.prompt}</h2>
              <div className="mt-6">
                <VoiceAnswerField
                  value={answers[question.key] as string}
                  onChange={(value) => patch({ [question.key]: value } as Partial<CapsuleAnswers>)}
                  placeholder={question.placeholder}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? setFlowStep("landing") : setStep((s) => s - 1))}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            icon={isSubmitting ? undefined : step === TOTAL_STEPS - 1 ? <SparkleIcon /> : <ArrowRightIcon />}
            disabled={!canAdvance() || isSubmitting}
            onClick={handleNext}
          >
            {isSubmitting
              ? "Reading your words…"
              : step === TOTAL_STEPS - 1
                ? "Create My Snapshot"
                : isPhotoStep && !answers.photoDataUrl
                  ? "Skip for now"
                  : "Next"}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
