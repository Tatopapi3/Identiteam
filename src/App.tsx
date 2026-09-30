import { AnimatePresence, motion } from "framer-motion";
import { CapsuleProvider, useCapsule } from "./state/CapsuleContext";
import { Landing } from "./components/screens/Landing";
import { CreateCapsule } from "./components/screens/CreateCapsule";
import { IdentitySnapshot } from "./components/screens/IdentitySnapshot";
import { SealCapsule } from "./components/screens/SealCapsule";
import { FutureCapsule } from "./components/screens/FutureCapsule";
import { TalkToPastSelf } from "./components/screens/TalkToPastSelf";
import { MilestoneCheckIn } from "./components/screens/MilestoneCheckIn";
import { ThenVsNow } from "./components/screens/ThenVsNow";

function Screen() {
  const { flowStep } = useCapsule();

  const screens: Record<string, JSX.Element> = {
    landing: <Landing />,
    create: <CreateCapsule />,
    snapshot: <IdentitySnapshot />,
    seal: <SealCapsule />,
    sealed: <SealCapsule />,
    opening: <FutureCapsule />,
    chat: <TalkToPastSelf />,
    milestones: <MilestoneCheckIn />,
    compare: <ThenVsNow />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={flowStep}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {screens[flowStep] ?? <Landing />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <CapsuleProvider>
      <Screen />
    </CapsuleProvider>
  );
}
