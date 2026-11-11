import { useEffect, useRef } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react';
import { TopBar } from './shell/TopBar';
import { Footer } from './shell/Footer';
import { useMode } from './shell/mode';
import { SceneSlot } from './scene/SceneSlot';
import { AdsPage } from './modes/ads/AdsPage';
import { ResearchPage } from './modes/research/ResearchPage';
import { MapsPage } from './modes/maps/MapsPage';
import type { Mode } from './content/types';

const pages: Record<Mode, () => React.JSX.Element> = {
  ads: AdsPage,
  research: ResearchPage,
  maps: MapsPage,
};

export function App() {
  const mode = useMode();
  const reduce = useReducedMotion();
  const first = useRef(true);
  const Page = pages[mode];

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
  }, [mode]);

  // Mode switch, after the toggle has already moved: the old page fades out fast with a slight
  // blur, then the new page fades in. The page itself only fades; its hero items carry the
  // movement (CSS .enter, an 8px rise with a short stagger), so there is one entrance per
  // element, not two stacked. The theme colours and the particle field cross-fade meanwhile.
  const ease = [0.23, 1, 0.32, 1] as const;
  const exit = reduce
    ? { opacity: 0, transition: { duration: 0.12 } }
    : { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.15, ease } };
  const enter = { opacity: 0 };
  const shown = reduce
    ? { opacity: 1, transition: { duration: 0.2 } }
    : { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.2, ease } };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SceneSlot mode={mode} />
      <TopBar />
      <LazyMotion features={domAnimation} strict>
        <AnimatePresence mode="wait" initial={false}>
          <m.main
            key={mode}
            id="main"
            className={`mode-page mode-page--${mode}`}
            tabIndex={-1}
            initial={enter}
            animate={shown}
            exit={exit}
          >
            <span id="top" />
            <Page />
          </m.main>
        </AnimatePresence>
      </LazyMotion>
      <Footer />
    </>
  );
}
