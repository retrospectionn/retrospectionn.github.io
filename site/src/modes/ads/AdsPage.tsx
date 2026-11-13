// Ads — "control room". Dark ink, amber accent, Geist with Geist Mono tabular figures.
// Order: hero, KPI strip, experience timeline, what I do, toolkit, contact.
import { adsHero, amazonTools, credentials, earlierRoles, experience, kpis, services, tools } from '../../content/ads';
import { profile } from '../../content/profile';

export function AdsPage() {
  return (
    <div className="ads">
      <section className="ads-hero" aria-labelledby="ads-title">
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
          <h2 id="ads-exp-title" className="ads-section__title">
            Experience
          </h2>
        </header>
        <ol>
          {experience.map((r) => (
            <li key={r.org} className="ads-role">
              {r.dates && <p className="ads-role__when tabular">{r.dates}</p>}
              <div className="ads-role__body">
                <h3 className="ads-role__org">{r.org}</h3>
                <p className="ads-role__title">
                  {r.title}
                  {r.place && <span className="ads-role__place"> · {r.place}</span>}
                </p>
                {r.points.length > 0 && (
                  <ul className="ads-role__points">
                    {r.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
        <h3 className="ads-earlier__title">Before Amazon</h3>
        <ul className="ads-earlier" role="list">
          {earlierRoles.map((r) => (
            <li key={r.org} className="ads-earlier__row">
              <span className="ads-earlier__when tabular">{r.dates}</span>
              <span>
                <span className="ads-earlier__org">{r.org}</span>
                <span className="ads-role__place">
                  {' · '}
                  {r.title}, {r.place}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ads-section" aria-labelledby="ads-cert-title">
        <header className="ads-section__head">
          <h2 id="ads-cert-title" className="ads-section__title">
            Certifications
          </h2>
        </header>
        <ul className="ads-certs" role="list">
          {credentials.map((c) => (
            <li key={c.name} className="ads-cert">
              <a className="ads-cert__name" href={c.href} rel="noopener" target="_blank">
                {c.name}
                <span className="sr-only-text"> (verify, opens in a new tab)</span>
              </a>
              <span className="ads-cert__meta">
                {c.issuer} · {c.when}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ads-section" aria-labelledby="ads-do-title">
        <header className="ads-section__head">
          <h2 id="ads-do-title" className="ads-section__title">
            What I do
          </h2>
        </header>
        <dl className="ads-services">
          {services.map((s) => (
            <div key={s.title} className="ads-service">
              <dt className="ads-service__title">{s.title}</dt>
              <dd className="ads-service__body">{s.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ads-section" aria-labelledby="ads-tools-title">
        <header className="ads-section__head">
          <h2 id="ads-tools-title" className="ads-section__title">
            Toolkit
          </h2>
        </header>
        <ul className="ads-apps" role="list">
          {amazonTools.map((t) => (
            <li key={t.name} className="ads-app">
              <img
                className="ads-app__icon"
                src={`${import.meta.env.BASE_URL}media/tools/${t.icon}.webp`}
                alt=""
                width={20}
                height={20}
                loading="lazy"
                decoding="async"
              />
              {t.name}
            </li>
          ))}
        </ul>
        <ul className="ads-tools" role="list">
          {tools.map((t, i) => (
            <li key={t} className="ads-tool">
              {i > 0 && (
                <span className="ads-tools__sep" aria-hidden="true">
                  {' · '}
                </span>
              )}
              <span className="ads-tool__name">{t}</span>
            </li>
          ))}
        </ul>

      </section>

      <section className="ads-section ads-contact" aria-labelledby="ads-contact-title">
        <header className="ads-section__head">
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
