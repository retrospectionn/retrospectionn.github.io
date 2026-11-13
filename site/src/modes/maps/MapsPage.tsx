// Maps. Deep green-black, IBM Plex Sans + Plex Mono, over the live Islamabad terrain.
import { formatDate, mapsArticles } from '../../content/articles';
import {
  fieldWork,
  forks,
  highlights,
  mapCertificates,
  mapTools,
  mapsHero,
  osmAttribution,
  projects,
  volunteering,
} from '../../content/maps';
import { profile } from '../../content/profile';
import { EditHeatmap } from './EditHeatmap';

const legend = [
  { id: 'mp-edits', sym: 'heat', label: 'Where I map' },
  { id: 'mp-projects', sym: 'square', label: 'Projects' },
  { id: 'mp-articles', sym: 'circle', label: 'Maps and articles' },
  { id: 'mp-field', sym: 'triangle', label: 'Field work' },
  { id: 'mp-tools', sym: 'diamond', label: 'Tools and training' },
] as const;

const coverArticles = mapsArticles.filter((a) => a.cover);
const textArticles = mapsArticles.filter((a) => !a.cover);

function Sym({ kind }: { kind: (typeof legend)[number]['sym'] }) {
  return <span className={`mp-sym mp-sym--${kind}`} aria-hidden="true" />;
}

export function MapsPage() {
  return (
    <div className="mp">
      <section className="mp-sheet" aria-labelledby="mp-title">
        <div className="mp-sheet__head">
          <h1 id="mp-title" className="mp-title enter">
            {profile.name}
            <span className="mp-title__role">{mapsHero.role}</span>
          </h1>
          <p className="mp-summary enter enter--1">{mapsHero.summary}</p>
          <p className="mp-coords tabular enter enter--fade enter--2">
            {mapsHero.coords.lat}, {mapsHero.coords.lon} · {mapsHero.coords.place}
          </p>
        </div>
      </section>

      <div className="mp-layout">
        <aside className="mp-legend" aria-labelledby="mp-legend-title">
          <h2 id="mp-legend-title" className="mp-label">
            Legend
          </h2>
          <ul className="mp-legend__list">
            {legend.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="mp-legend__item">
                  <Sym kind={l.sym} />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mp-about">
            <img src={profile.headshot} alt={`Portrait of ${profile.name}`} width={64} height={64} className="mp-about__img" />
            <p className="mp-about__text">
              Based in {profile.location}. Volunteer with{' '}
              <a className="text-link" href={profile.links.codeForPakistan.href} rel="noopener" target="_blank">
                Code for Pakistan
                <span className="sr-only-text"> (opens in a new tab)</span>
              </a>{' '}
              and OpenStreetMap Community Pakistan.
            </p>
          </div>
        </aside>

        <div className="mp-main">
          <section id="mp-edits" className="mp-section" aria-labelledby="mp-edits-title">
            <h2 id="mp-edits-title" className="mp-section__title">
              <Sym kind="heat" /> Where I map
            </h2>
            <p className="mp-heat__lede">
              My edits to OpenStreetMap across Pakistan. Brighter areas have more edits; zoom in for detail.
            </p>
            <EditHeatmap />
          </section>

          <section id="mp-projects" className="mp-section" aria-labelledby="mp-projects-title">
            <h2 id="mp-projects-title" className="mp-section__title">
              <Sym kind="square" /> Projects
            </h2>
            <ul className="mp-projects">
              {projects.map((p) => (
                <li key={p.name} className={`mp-project${p.image ? ' mp-project--feature' : ''}`}>
                  {p.image && (
                    <img className="mp-project__img" src={p.image} alt={p.imageAlt ?? ''} loading="lazy" width={800} height={400} />
                  )}
                  <div className="mp-project__body">
                    <h3 className="mp-project__name">{p.name}</h3>
                    <p className="mp-project__summary">{p.summary}</p>
                    {p.stack && <p className="mp-project__stack">{p.stack.join(' · ')}</p>}
                    <p className="mp-project__links">
                      <a className="text-link" href={p.href} rel="noopener" target="_blank">
                        Repository<span className="sr-only-text"> for {p.name} (opens in a new tab)</span>
                      </a>
                      {p.live && (
                        <a className="text-link" href={p.live} rel="noopener" target="_blank">
                          Live site<span className="sr-only-text"> for {p.name} (opens in a new tab)</span>
                        </a>
                      )}
                      {p.license && <span className="mp-project__license">{p.license}</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mp-forks">
              Forks:{' '}
              {forks.map((f, i) => (
                <span key={f.name}>
                  <a className="text-link" href={f.href} rel="noopener" target="_blank">
                    {f.name}
                  </a>{' '}
                  — {f.summary}
                  {i < forks.length - 1 && ' '}
                </span>
              ))}
            </p>
          </section>

          <section id="mp-articles" className="mp-section" aria-labelledby="mp-articles-title">
            <h2 id="mp-articles-title" className="mp-section__title">
              <Sym kind="circle" /> Maps and articles
            </h2>
            {coverArticles.length > 0 && (
              <ul className="mp-tiles">
                {coverArticles.map((a) => (
                  <li key={a.slug} className="mp-tile">
                    <a className="mp-tile__link" href={a.link} rel="noopener" target="_blank">
                      <div className="mp-tile__frame">
                        <img src={a.cover ?? undefined} alt="" loading="lazy" className="mp-tile__img" />
                      </div>
                      <div className="mp-tile__body">
                        <p className="mp-tile__date tabular">{formatDate(a.date)}</p>
                        <h3 className="mp-tile__title">{a.title}</h3>
                        <p className="mp-tile__summary">{a.summary}</p>
                      </div>
                      <span className="sr-only-text"> (Medium, opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {textArticles.length > 0 && (
              <ul className="mp-articles">
                {textArticles.map((a) => (
                  <li key={a.slug} className="mp-article">
                    <p className="mp-article__date tabular">{formatDate(a.date)}</p>
                    <h3 className="mp-article__title">
                      <a className="text-link" href={a.link} rel="noopener" target="_blank">
                        {a.title}
                        <span className="sr-only-text"> (Medium, opens in a new tab)</span>
                      </a>
                    </h3>
                    <p className="mp-article__summary">{a.summary}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mp-attrib">Cover images are the author’s own maps. Where OpenStreetMap data is shown: {osmAttribution}.</p>
          </section>

          <section id="mp-field" className="mp-section" aria-labelledby="mp-field-title">
            <h2 id="mp-field-title" className="mp-section__title">
              <Sym kind="triangle" /> Field work and volunteering
            </h2>
            <div className="mp-field">
              {fieldWork.map((r) => (
                <div key={r.org} className="mp-field__item">
                  <h3 className="mp-field__org">
                    {r.href ? (
                      <a className="text-link" href={r.href} rel="noopener" target="_blank">
                        {r.org}
                        <span className="sr-only-text"> on LinkedIn (opens in a new tab)</span>
                      </a>
                    ) : (
                      r.org
                    )}
                  </h3>
                  <p className="mp-field__title">
                    {r.title}
                    {r.dates && <span className="tabular"> · {r.dates}</span>}
                  </p>
                  {r.points.length > 0 && (
                    <ul className="mp-field__points">
                      {r.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <ul className="mp-highlights">
              {highlights.map((h) => (
                <li key={h.title}>
                  <strong>{h.title}.</strong> {h.body}
                </li>
              ))}
              <li>
                <strong>Also volunteered.</strong> {volunteering.join('; ')}.
              </li>
            </ul>
          </section>

          <section id="mp-tools" className="mp-section" aria-labelledby="mp-tools-title">
            <h2 id="mp-tools-title" className="mp-section__title">
              <Sym kind="diamond" /> Tools and training
            </h2>
            <ul className="mp-tools">
              {mapTools.map((t, i) => (
                <li key={t}>
                  {i > 0 && <span aria-hidden="true">{' · '}</span>}
                  {t}
                </li>
              ))}
            </ul>
            <ul className="mp-certs" role="list">
              {mapCertificates.map((c) => (
                <li key={c.name} className="mp-cert">
                  <p className="mp-cert__name">{c.name}</p>
                  <p className="mp-cert__meta tabular">
                    {c.issuer} · {c.when}
                  </p>
                  <p className="mp-cert__body">{c.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
