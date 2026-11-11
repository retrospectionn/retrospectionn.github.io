import { useSyncExternalStore } from 'react';
import { SHOW_EMAIL, modeMeta, profile } from '../content/profile';
import { osmAttribution } from '../content/maps';
import type { Mode } from '../content/types';
import { MODES, useMode } from './mode';
import { ModeLink } from './ModeLink';

const crossLabel: Record<Mode, string> = {
  ads: 'Amazon ads work',
  research: 'research',
  maps: 'maps',
};

/** html[data-scene], set by SceneSlot once the field is live ("terrain" = real Islamabad DEM). */
function subscribeScene(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-scene'] });
  return () => obs.disconnect();
}
const getScene = () => document.documentElement.dataset.scene ?? '';

export function Footer() {
  const mode = useMode();
  const scene = useSyncExternalStore(subscribeScene, getScene, () => '');
  const others = MODES.filter((m) => m !== mode);
  const contact = [
    profile.links.linkedin,
    profile.links.github,
    profile.links.medium,
    profile.links.codeForPakistan,
  ];

  return (
    <footer className="site-footer" id="contact-links">
      <div className="site-footer__inner">
        <div className="site-footer__contact">
          <p className="site-footer__label">Contact</p>
          <ul className="site-footer__links">
            {SHOW_EMAIL && profile.email[mode] && (
              <li>
                <a className="text-link" href={`mailto:${profile.email[mode]}`}>
                  {profile.email[mode]}
                </a>
              </li>
            )}
            {contact.map((l) => (
              <li key={l.href}>
                <a className="text-link" href={l.href} rel="me noopener" target="_blank">
                  {l.label}
                  <span className="sr-only-text"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p className="site-footer__cross">
          Also: my{' '}
          <ModeLink mode={others[0]!} className="text-link">
            {crossLabel[others[0]!]}
          </ModeLink>{' '}
          and{' '}
          <ModeLink mode={others[1]!} className="text-link">
            {crossLabel[others[1]!]}
          </ModeLink>
          .
        </p>
        <p className="site-footer__meta">
          © {new Date().getFullYear()} {profile.name} · {modeMeta[mode].role} · {profile.location}
        </p>
        {mode === 'maps' && (
          <p className="site-footer__credits">
            {osmAttribution}
            {scene === 'terrain' && <> · Terrain: Mapzen / AWS Terrain Tiles</>}
          </p>
        )}
      </div>
    </footer>
  );
}
