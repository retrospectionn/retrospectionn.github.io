// Research — "journal page". Warm paper, Newsreader serif with Source Sans 3 labels.
// Single ~68ch column, numbered sections, margin notes on wide screens, citations.
import type { ReactNode } from 'react';
import { formatDate, researchArticles } from '../../content/articles';
import { profile } from '../../content/profile';
import {
  education,
  methods,
  natureNote,
  publications,
  researchExperience,
  researchHero,
} from '../../content/research';

function Section({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
  return (
    <section className="rs-section" aria-labelledby={id}>
      <h2 id={id} className="rs-section__title">
        <span className="rs-section__num">§{n}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <aside className="rs-note">
      <span className="rs-note__mark" aria-hidden="true">
        ※
      </span>
      {children}
    </aside>
  );
}

export function ResearchPage() {
  return (
    <article className="rs">
      <header className="rs-head">
        <p className="rs-kicker enter enter--fade">Curriculum · Research</p>
        <h1 className="rs-title enter">{profile.name}</h1>
        <p className="rs-role enter enter--1">{researchHero.role}</p>
        <div className="rs-about enter enter--2">
          <figure className="rs-portrait">
            <img src={profile.headshot} alt={`Portrait of ${profile.name}`} width={120} height={120} loading="eager" />
          </figure>
          <p className="rs-abstract">
            <span className="rs-abstract__label">Abstract.</span> {researchHero.summary}
          </p>
        </div>
      </header>

      <Section n={1} id="rs-education" title="Education">
        {education.map((d) => (
          <div key={d.degree} className="rs-entry">
            <h3 className="rs-entry__title">{d.degree}</h3>
            <p className="rs-entry__meta">
              {d.school}, {d.place} · <span className="tabular">{d.dates}</span>
            </p>
            <ul className="rs-list">
              {d.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            {d.school === 'HSE University' && <Note>{natureNote}</Note>}
          </div>
        ))}
      </Section>

      <Section n={2} id="rs-experience" title="Research experience">
        {researchExperience.map((r) => (
          <div key={r.org} className="rs-entry">
            <h3 className="rs-entry__title">{r.org}</h3>
            <p className="rs-entry__meta">
              {r.title}
              {r.place && <>, {r.place}</>}
              {r.dates && (
                <>
                  {' '}
                  · <span className="tabular">{r.dates}</span>
                </>
              )}
            </p>
            {r.points.length > 0 && (
              <ul className="rs-list">
                {r.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            {r.org.startsWith('Sustainable') && (
              <Note>Publications written at SDPI are listed under §3.</Note>
            )}
          </div>
        ))}
      </Section>

      <Section n={3} id="rs-publications" title="Publications and writing">
        <h3 className="rs-sub">Reports and articles</h3>
        <ol className="rs-cites">
          {publications.map((c) => (
            <li key={c.title} className="rs-cite">
              {c.author} <span className="rs-cite__title">“{c.title}.”</span> <em>{c.venue}</em>
              {c.date && <>, {c.date}</>}.
              {c.href && (
                <>
                  {' '}
                  <a className="text-link" href={c.href} rel="noopener" target="_blank">
                    Read<span className="sr-only-text"> “{c.title}” (opens in a new tab)</span>
                  </a>
                </>
              )}
            </li>
          ))}
        </ol>
        <h3 className="rs-sub">Essays on Medium</h3>
        <ol className="rs-cites">
          {researchArticles.map((a) => (
            <li key={a.slug} className="rs-cite">
              Khan, A. <span className="rs-cite__title">“{a.title}.”</span>{' '}
              <em>{a.publication ? `${a.publication} (Medium)` : 'Medium'}</em>, {formatDate(a.date)}.{' '}
              <a className="text-link" href={a.link} rel="noopener" target="_blank">
                Read<span className="sr-only-text"> “{a.title}” on Medium (opens in a new tab)</span>
              </a>
              <p className="rs-cite__summary">{a.summary}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section n={4} id="rs-methods" title="Methods">
        <p className="rs-methods">
          {methods.map((m, i) => (
            <span key={m}>
              {m}
              {i < methods.length - 1 && <span aria-hidden="true"> · </span>}
            </span>
          ))}
        </p>
      </Section>
    </article>
  );
}
