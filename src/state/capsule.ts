export type CapsuleAnswers = {
  name: string;
  photoDataUrl?: string;
  currentGoals: string;
  worries: string;
  whatMatters: string;
  hopesForChange: string;
  dearFutureMe: string;
};

export type IdentitySnapshot = {
  whoIAmNow: string;
  goals: string;
  hopes: string;
  worries: string;
  whatMatters: string;
  whoIWantToBecome: string;
};

export type Capsule = {
  id: string;
  createdAt: string;
  sealDurationDays: number;
  reopenAt: string;
  sealed: boolean;
  opened: boolean;
  answers: CapsuleAnswers;
  snapshot: IdentitySnapshot;
  milestones?: string[];
  reflection?: string;
};

export type FlowStep =
  | "landing"
  | "create"
  | "snapshot"
  | "seal"
  | "sealed"
  | "opening"
  | "chat"
  | "milestones"
  | "compare";

export const SEAL_DURATIONS: { label: string; days: number }[] = [
  { label: "30 days", days: 30 },
  { label: "6 months", days: 182 },
  { label: "1 year", days: 365 },
];

export const EMPTY_ANSWERS: CapsuleAnswers = {
  name: "",
  photoDataUrl: undefined,
  currentGoals: "",
  worries: "",
  whatMatters: "",
  hopesForChange: "",
  dearFutureMe: "",
};

const CAPSULES_KEY = "future-me:capsules";
const ACTIVE_KEY = "future-me:active-id";

export function loadCapsules(): Capsule[] {
  try {
    const raw = localStorage.getItem(CAPSULES_KEY);
    return raw ? (JSON.parse(raw) as Capsule[]) : [];
  } catch {
    return [];
  }
}

export function saveCapsules(capsules: Capsule[]) {
  try {
    localStorage.setItem(CAPSULES_KEY, JSON.stringify(capsules));
  } catch {
    // storage unavailable — capsule stays in memory for this session only
  }
}

export function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export function reopenDate(createdAt: string, days: number): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function daysRemaining(reopenAt: string): number {
  const ms = new Date(reopenAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
