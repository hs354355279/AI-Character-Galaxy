import { BrandMark } from "@/components/shared/BrandMark";

export function Hero() {
  return (
    <header className="home-hero">
      <nav className="hero-nav glass-material" aria-label="Primary navigation">
        <BrandMark />
        <a className="secondary-action pressable" href="#official-lessons">
          Browse lessons
        </a>
      </nav>
      <div className="hero-copy">
        <p className="eyebrow">Evidence-grounded learning · Ages 12–15</p>
        <h1 className="display-title">Explore why relationships mattered.</h1>
        <p className="body-copy hero-description">
          History and literature become easier to understand when you can see who influenced,
          challenged, trusted, and changed one another.
        </p>
      </div>
      <div className="hero-proof" aria-label="How learning works">
        <span>Observe the galaxy</span>
        <span aria-hidden="true">→</span>
        <span>Follow evidence</span>
        <span aria-hidden="true">→</span>
        <span>Explain what changed</span>
      </div>
    </header>
  );
}
