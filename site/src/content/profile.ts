import type { Link, Mode } from './types';
import meta from './meta.json';

/** Email stays hidden until the owner confirms which address to show (PLAN G4). */
export const SHOW_EMAIL = false;

export const profile = {
  name: 'Ammaz Khan',
  location: 'Pakistan',
  /** Used in Research and Maps "about" blocks. Swappable (PLAN G6). */
  headshot: '/media/headshot.webp',
  headshotSource: 'https://codeforpakistan.org/media/people/ammaz.jpg',
  links: {
    github: { label: 'GitHub', href: 'https://github.com/retrospectionn' },
    linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ammazkhan1' },
    medium: { label: 'Medium', href: 'https://medium.com/@CasualVisionary' },
    codeForPakistan: {
      label: 'Code for Pakistan',
      href: 'https://codeforpakistan.org/about/people/ammaz-khan',
    },
  } satisfies Record<string, Link>,
  /**
   * Left empty on purpose: no address is shipped (not even in the bundle) until the owner
   * picks one per mode. Fill these in and set SHOW_EMAIL to true to show them in the footer.
   */
  email: {
    ads: '',
    research: '',
    maps: '',
  } satisfies Record<Mode, string>,
};

export interface ModeMeta {
  label: string;
  role: string;
  title: string;
  description: string;
}

/** Shared with scripts/postbuild.mjs, which reads the same JSON. */
export const modeMeta: Record<Mode, ModeMeta> = meta.modes;
