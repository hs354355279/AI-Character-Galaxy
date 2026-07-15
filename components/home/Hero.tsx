import Image from "next/image";

const titleLines = ["Every person", "has a universe", "of relationships."];

export function Hero() {
  return (
    <header className="editorial-hero" aria-labelledby="hero-title">
      <div className="hero-art" aria-hidden="true">
        <Image
          src="/images/landing/hero-orbital-exhibition.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="hero-editorial-copy">
        <p className="landing-eyebrow">Evidence-grounded learning · Ages 12–15</p>
        <h1 id="hero-title" className="editorial-display" aria-label={titleLines.join(" ")}>
          {titleLines.map((line) => (
            <span className="hero-title-line" aria-hidden="true" key={line}>
              {line}
            </span>
          ))}
        </h1>
        <div className="hero-support">
          <p>Explore why relationships mattered.</p>
          <a className="editorial-link" href="#official-lessons">
            Browse lessons <span aria-hidden="true">↘</span>
          </a>
        </div>
      </div>
      <a className="scroll-cue" href="#method">
        <span>Scroll to enter</span>
        <i aria-hidden="true" />
      </a>
    </header>
  );
}
