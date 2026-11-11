// Three-way mode toggle. Duplicated-list clip-path technique: the second list is styled as
// "active" and clipped to the selected segment, so label colours swap cleanly as the clip moves.
// Pointer changes slide the clip (220 ms, ease-out); keyboard changes move it with no slide.
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { modeMeta } from '../content/profile';
import type { Mode } from '../content/types';
import { MODES, getLastInput, setMode, useMode } from './mode';

export function ModeToggle() {
  const mode = useMode();
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<Mode, HTMLButtonElement | null>>({
    ads: null,
    research: null,
    maps: null,
  });
  const [clip, setClip] = useState<{ left: number; right: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const group = groupRef.current;
    const measure = () => {
      const btn = buttonRefs.current[mode];
      if (!group || !btn) return;
      const left = btn.offsetLeft;
      const right = group.clientWidth - (btn.offsetLeft + btn.offsetWidth);
      setClip({ left, right });
    };
    // Slide only for pointer input after first paint; keyboard and history changes jump.
    setAnimate(getLastInput() === 'pointer');
    measure();
    if (!group) return;
    const ro = new ResizeObserver(() => {
      setAnimate(false);
      measure();
    });
    ro.observe(group);
    return () => ro.disconnect();
  }, [mode]);

  const choose = (next: Mode, input: 'pointer' | 'keyboard') => {
    setMode(next, input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = MODES.indexOf(mode);
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % MODES.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + MODES.length) % MODES.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = MODES.length - 1;
    if (next === null) return;
    e.preventDefault();
    const target = MODES[next]!;
    choose(target, 'keyboard');
    buttonRefs.current[target]?.focus();
  };

  const clipPath = clip
    ? `inset(0 ${clip.right}px 0 ${clip.left}px round var(--toggle-radius))`
    : 'inset(0 100% 0 0)';

  return (
    <div className="mode-toggle" data-animate={animate || undefined}>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Portfolio mode"
        className="mode-toggle__list"
        onKeyDown={onKeyDown}
      >
        {MODES.map((m) => (
          <button
            key={m}
            ref={(el) => {
              buttonRefs.current[m] = el;
            }}
            type="button"
            role="radio"
            aria-checked={m === mode}
            tabIndex={m === mode ? 0 : -1}
            className="mode-toggle__segment"
            onClick={() => choose(m, 'pointer')}
          >
            {modeMeta[m].label}
          </button>
        ))}
      </div>
      {/* Active copy: same labels, clipped to the selected segment. Decorative only. */}
      <div className="mode-toggle__list mode-toggle__list--active" aria-hidden="true" style={{ clipPath }}>
        {MODES.map((m) => (
          <span key={m} className="mode-toggle__segment">
            {modeMeta[m].label}
          </span>
        ))}
      </div>
    </div>
  );
}
