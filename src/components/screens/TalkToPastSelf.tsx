import { useEffect, useRef, useState } from "react";
import { useCapsule } from "../../state/CapsuleContext";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";
import { askPastSelf } from "../../lib/api";
import { Button } from "../ui/Button";
import { MicButton } from "../ui/MicButton";
import { PageShell } from "../ui/PageShell";
import { Waveform } from "../ui/Waveform";
import { ArrowRightIcon, PauseIcon, PlayIcon } from "../ui/icons";

type Message = { role: "user" | "assistant"; text: string };

const SUGGESTED = [
  "What was I worried about?",
  "What did I want to accomplish?",
  "What mattered most to me?",
  "What did I hope would change?",
  "Did I think I could accomplish my goals?",
];

export function TalkToPastSelf() {
  const { activeCapsule, setFlowStep } = useCapsule();
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [pending, setPending] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { supported, isListening, transcript, interim, start, stop, reset } = useSpeechToText();
  const { supported: ttsSupported, isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (!isListening && transcript.trim()) {
      void sendQuestion(transcript.trim());
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  if (!activeCapsule) return null;

  async function sendQuestion(question: string) {
    if (!question.trim() || pending) return;
    const nextHistory: Message[] = [...messages, { role: "user", text: question }];
    setMessages(nextHistory);
    setTextInput("");
    setPending(true);
    try {
      const { reply } = await askPastSelf({
        answers: activeCapsule!.answers,
        snapshot: activeCapsule!.snapshot,
        question,
        history: messages,
      });
      setMessages((prev) => {
        const updated: Message[] = [...prev, { role: "assistant", text: reply }];
        if (ttsSupported) {
          setSpeakingIndex(updated.length - 1);
        }
        return updated;
      });
      if (ttsSupported) speak(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I can't quite reach back right now — the connection to the archive dropped. Try asking again in a moment.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function handleMicClick() {
    if (isListening) stop();
    else {
      reset();
      start();
    }
  }

  function handleReplay(index: number, text: string) {
    if (isSpeaking && speakingIndex === index) {
      stopSpeaking();
      setSpeakingIndex(null);
    } else {
      setSpeakingIndex(index);
      speak(text);
    }
  }

  return (
    <PageShell wide eyebrow="Talk to Me From the Past">
      <div className="flex flex-1 flex-col">
        <div className="text-center drift-up">
          <h1 className="font-display text-4xl text-ink">
            A reflection of <span className="italic text-gold-bright">{activeCapsule.answers.name}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
            Not a real-time consciousness — a voice built only from what was archived in this
            capsule. Ask it anything you wrote down.
          </p>
        </div>

        {messages.length === 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2 drift-up">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => void sendQuestion(q)}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold/50 hover:text-gold-bright"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex-1 space-y-4 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} drift-up`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-gold/15 text-gold-bright border border-gold/30"
                    : "bg-midnight-3 border border-border text-ink"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-gold-dim">
                      Past Self
                    </span>
                    {ttsSupported && (
                      <button
                        onClick={() => handleReplay(i, m.text)}
                        className="text-gold-dim hover:text-gold-bright"
                        aria-label="Replay"
                      >
                        {isSpeaking && speakingIndex === i ? (
                          <PauseIcon className="h-3.5 w-3.5" />
                        ) : (
                          <PlayIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border bg-midnight-3 px-5 py-3.5 text-sm text-muted">
                Reaching back through the archive…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 border-t border-border pt-6">
          <div className="flex items-center gap-4">
            <MicButton isListening={isListening} onClick={handleMicClick} disabled={pending} />
            <div>
              <Waveform active={isListening} />
              <p className="mt-1 text-xs text-muted">
                {!supported
                  ? "Voice input not supported here — type below."
                  : isListening
                    ? "Listening…"
                    : "Press to ask a question"}
              </p>
            </div>
          </div>
          {isListening && interim && <p className="text-sm italic text-muted">{interim}</p>}

          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendQuestion(textInput);
            }}
          >
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type a question…"
              className="flex-1 rounded-full border border-border bg-midnight-3/70 px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:border-gold/50 focus:outline-none"
            />
            <Button type="submit" size="md" disabled={!textInput.trim() || pending}>
              Ask
            </Button>
          </form>
        </div>

        {messages.length > 0 && (
          <div className="mt-8 flex justify-center drift-up">
            <Button
              size="lg"
              icon={<ArrowRightIcon />}
              onClick={() => setFlowStep("milestones")}
            >
              So… what happened?
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
