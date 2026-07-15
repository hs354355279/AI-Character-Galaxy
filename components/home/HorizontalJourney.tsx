const steps = [
  {
    number: "01",
    title: "Observe the galaxy",
    copy: "See people as a living map of roles, loyalties, and pressure.",
  },
  {
    number: "02",
    title: "Follow the evidence",
    copy: "Open every official relationship and trace it back to a source.",
  },
  {
    number: "03",
    title: "Explain what changed",
    copy: "Turn discoveries into a concise evidence-grounded explanation.",
  },
];

export function HorizontalJourney() {
  return (
    <section id="method" className="journey-section" aria-labelledby="journey-title">
      <div className="journey-intro">
        <p className="landing-eyebrow">01 — Learning method</p>
        <h2 id="journey-title">Read relationships in three movements.</h2>
      </div>
      <div className="journey-viewport">
        <div className="journey-track">
          {steps.map((step) => (
            <article className="journey-panel" key={step.number}>
              <span className="journey-number" aria-hidden="true">
                {step.number}
              </span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
              <span className="journey-rule" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
