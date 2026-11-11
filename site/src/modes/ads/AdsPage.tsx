// Ads — "control room". Dark ink, amber accent, Geist with Geist Mono tabular figures.
// Order (PLAN 6): hero, KPI strip, experience timeline, what I do, toolkit, StrataTech, contact.
import { adsHero, credentials, experience, kpis, services, strataTech, tools } from '../../content/ads';
import { profile } from '../../content/profile';

export function AdsPage() {
  return (
    <div className="ads">
      <section className="ads-hero" aria-labelledby="ads-title">
        <p className="ads-eyebrow enter enter--fade">
          <span className="ads-dot" aria-hidden="true" />
          {adsHero.role} · {profile.location}
        </p>
        <h1 id="ads-title" className="ads-hero__title enter">
          {profile.name}
          <span className="ads-hero__role">{adsHero.role}</span>
        </h1>
        <p className="ads-hero__summary enter enter--1">{adsHero.summary}</p>
        <div className="ads-hero__actions enter enter--2">
          <a className="ads-button ads-button--primary" href={profile.links.linkedin.href} rel="me noopener" target="_blank">
            Contact on LinkedIn<span className="sr-only-text"> (opens in a new tab)</span>
          </a>
          <a className="ads-button" href="#ads-experience">
            See experience
          </a>
        </div>
      </section>

      <section className="ads-kpis enter enter--fade enter--3" aria-labelledby="ads-kpis-title">
        <h2 id="ads-kpis-title" className="sr-only-text">
          Key figures
        </h2>
        <dl className="ads-kpis__grid">
          {kpis.map((k) => (
            <div key={k.label} className="ads-kpi">
              <dt className="ads-kpi__label">{k.label}</dt>
              <dd className="ads-kpi__value tabular">{k.value}</dd>
              <dd className="ads-kpi__source">{k.source}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="ads-experience" className="ads-section" aria-labelledby="ads-exp-title">
        <header className="ads-section__head">
          <span className="ads-section__index tabular">01</span>
          <h2 id="ads-exp-title" className="ads-section__title">
            Experience
          </h2>
        </header>
        <ol className="ads-timeline">
          {experience.map((r) => (
            <li key={r.org} className="ads-role">
              <div className="ads-role__when tabular">{r.dates ?? ''}</div>
              <div className="ads-role__body">
                <h3 className="ads-role__org">{r.org}</h3>
                <p className="ads-role__title">
                  {r.title}
                  {r.place && <span className="ads-role__place"> · {r.place}</span>}
                </p>
                {r.chips && (
                  <ul className="ads-chips" aria-label="Highlights">
                    {r.chips.map((c) => (
                      <li key={c} className="ads-chip tabular">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="ads-role__points">
                  {r.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ads-section" aria-labelledby="ads-do-title">
        <header className="ads-section__head">
          <span className="ads-section__index tabular">02</span>
          <h2 id="ads-do-title" className="ads-section__title">
            What I do
          </h2>
        </header>
        <ul className="ads-services">
          {services.map((s, i) => (
            <li key={s.title} className="ads-service">
              <span className="ads-service__n tabular">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="ads-service__title">{s.title}</h3>
              <p className="ads-service__body">{s.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="ads-section" aria-labelledby="ads-tools-title">
        <header className="ads-section__head">
          <span className="ads-section__index tabular">03</span>
          <h2 id="ads-tools-title" className="ads-section__title">
            Toolkit
          </h2>
        </header>
        <ul className="ads-tools">
          {tools.map((t) => (
            <li key={t} className="ads-tool">
              {t}
            </li>
          ))}
        </ul>
        <p className="ads-cred">
          {credentials.map((c) => (
            <span key={c.name}>
              {c.name} <span className="tabular">{c.year}</span>
            </span>
          ))}
        </p>
      </section>

      <section className="ads-section" aria-labelledby="ads-now-title">
        <header className="ads-section__head">
          <span className="ads-section__index tabular">04</span>
          <h2 id="ads-now-title" className="ads-section__title">
            Now
          </h2>
        </header>
        <div className="ads-now">
          <p className="ads-now__label">Current venture</p>
          <h3 className="ads-now__org">{strataTech.org}</h3>
          <p className="ads-now__meta tabular">
            {strataTech.title} · {strataTech.place} · {strataTech.dates}
          </p>
        </div>
      </section>

      <section className="ads-section ads-contact" aria-labelledby="ads-contact-title">
        <header className="ads-section__head">
          <span className="ads-section__index tabular">05</span>
          <h2 id="ads-contact-title" className="ads-section__title">
            Contact
          </h2>
        </header>
        <p className="ads-contact__text">
          For account management, PPC or brand-store work, message me on LinkedIn.
        </p>
        <a className="ads-button ads-button--primary" href={profile.links.linkedin.href} rel="me noopener" target="_blank">
          Message on LinkedIn<span className="sr-only-text"> (opens in a new tab)</span>
        </a>
      </section>
    </div>
  );
}
