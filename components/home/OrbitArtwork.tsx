export function OrbitArtwork({ accent }: { accent: "coral" | "violet" }) {
  return (
    <svg
      className={`orbit-overlay orbit-overlay--${accent}`}
      viewBox="0 0 600 800"
      aria-hidden="true"
    >
      <ellipse cx="300" cy="390" rx="250" ry="95" />
      <ellipse cx="300" cy="390" rx="170" ry="310" transform="rotate(28 300 390)" />
      <path d="M40 620 C180 470 330 520 565 220" />
      <circle cx="122" cy="570" r="7" />
      <circle cx="470" cy="270" r="10" />
    </svg>
  );
}
