const safeguards = [
  ["01", "Evidence first", "Every official relationship includes a source."],
  ["02", "Works offline", "Prepared missions and checks stay available."],
  ["03", "Private by design", "Progress stays in this browser session."],
];

export function EvidenceManifesto() {
  return (
    <>
      <section
        id="evidence"
        className="evidence-manifesto"
        aria-labelledby="evidence-title"
      >
        <p className="landing-eyebrow">03 — Learning safeguards</p>
        <h2 id="evidence-title">Evidence is part of the experience.</h2>
        <div className="safeguard-list">
          {safeguards.map(([number, title, copy]) => (
            <div className="safeguard-row" key={number}>
              <span aria-hidden="true">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="editorial-footer">
        <a href="#top">AI Character Galaxy</a>
        <p>Every person has a universe of relationships.</p>
        <span>OpenAI Build Week · Education</span>
      </footer>
    </>
  );
}
