import { profile } from '../content/profile';
import { ModeToggle } from './ModeToggle';

const links = [profile.links.github, profile.links.linkedin, profile.links.medium];

export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <a className="topbar__name" href="#top">
          {profile.name}
        </a>
        <div className="topbar__toggle">
          <ModeToggle />
        </div>
        <nav className="topbar__links" aria-label="Profiles">
          {links.map((l) => (
            <a key={l.href} href={l.href} rel="me noopener" target="_blank" className="topbar__link">
              {l.label}
              <span className="sr-only-text"> (opens in a new tab)</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
