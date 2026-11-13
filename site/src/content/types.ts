export type Mode = 'ads' | 'research' | 'maps';

export interface Link {
  label: string;
  href: string;
}

export interface Role {
  org: string;
  /** The organisation's own page, when the owner supplied one. */
  href?: string;
  title: string;
  /** Omitted when the source does not give one. Never guess. */
  place?: string;
  /** Omitted when the source does not give dates (e.g. Upscale Valley). */
  dates?: string;
  points: string[];
}

export interface Kpi {
  value: string;
  label: string;
  /** The role the figure comes from. */
  source: string;
}

export interface Service {
  title: string;
  body: string;
}

export interface Degree {
  degree: string;
  school: string;
  place: string;
  dates: string;
  notes: string[];
}

export interface Citation {
  author: string;
  title: string;
  venue: string;
  date?: string;
  href?: string;
}

export interface Project {
  name: string;
  summary: string;
  stack?: string[];
  href: string;
  live?: string;
  image?: string;
  imageAlt?: string;
  license?: string;
}

export interface Article {
  slug: string;
  title: string;
  link: string;
  date: string;
  cover: string | null;
  summary: string;
  publication?: string;
}

export interface MediumPost {
  slug: string;
  title: string;
  link: string;
  date: string;
  tags: string[];
  cover: string | null;
  coverSource: string | null;
}
