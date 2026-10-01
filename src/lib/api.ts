import type { CapsuleAnswers, IdentitySnapshot } from "../state/capsule";

async function post<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Request to ${path} failed (${res.status}): ${detail}`);
  }
  return res.json() as Promise<TResponse>;
}

export function generateSnapshot(answers: CapsuleAnswers) {
  return post<{ snapshot: IdentitySnapshot }>("/snapshot", { answers });
}

export function askPastSelf(params: {
  answers: CapsuleAnswers;
  snapshot: IdentitySnapshot;
  question: string;
  history: { role: "user" | "assistant"; text: string }[];
}) {
  return post<{ reply: string; clip?: string }>("/chat", params);
}

export function extractMilestones(freeformText: string) {
  return post<{ milestones: string[] }>("/milestones", { freeformText });
}

export function generateReflection(params: {
  answers: CapsuleAnswers;
  snapshot: IdentitySnapshot;
  milestones: string[];
}) {
  return post<{ reflection: string }>("/reflect", params);
}
