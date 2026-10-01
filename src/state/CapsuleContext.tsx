import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Capsule, FlowStep } from "./capsule";
import { loadActiveId, loadCapsules, saveActiveId, saveCapsules } from "./capsule";

type CapsuleContextValue = {
  capsules: Capsule[];
  activeCapsule: Capsule | null;
  flowStep: FlowStep;
  setFlowStep: (step: FlowStep) => void;
  createCapsule: (capsule: Capsule) => void;
  updateActiveCapsule: (patch: Partial<Capsule>) => void;
  selectCapsule: (id: string | null) => void;
  startNewCapsule: () => void;
};

const CapsuleCtx = createContext<CapsuleContextValue | null>(null);

export function CapsuleProvider({ children }: { children: ReactNode }) {
  const [capsules, setCapsules] = useState<Capsule[]>(() => loadCapsules());
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveId());
  const [flowStep, setFlowStep] = useState<FlowStep>(() =>
    loadActiveId() ? "landing" : "landing",
  );

  useEffect(() => {
    saveCapsules(capsules);
  }, [capsules]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  const activeCapsule = useMemo(
    () => capsules.find((c) => c.id === activeId) ?? null,
    [capsules, activeId],
  );

  const value: CapsuleContextValue = {
    capsules,
    activeCapsule,
    flowStep,
    setFlowStep,
    createCapsule: (capsule) => {
      setCapsules((prev) => [...prev, capsule]);
      setActiveId(capsule.id);
    },
    updateActiveCapsule: (patch) => {
      setCapsules((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, ...patch } : c)),
      );
    },
    selectCapsule: (id) => setActiveId(id),
    startNewCapsule: () => {
      setActiveId(null);
      setFlowStep("create");
    },
  };

  return <CapsuleCtx.Provider value={value}>{children}</CapsuleCtx.Provider>;
}

export function useCapsule() {
  const ctx = useContext(CapsuleCtx);
  if (!ctx) throw new Error("useCapsule must be used within CapsuleProvider");
  return ctx;
}
