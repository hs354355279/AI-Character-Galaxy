import Link from "next/link";

export function BrandMark() {
  return (
    <Link className="brand-mark pressable" href="/" aria-label="AI Character Galaxy home">
      <span className="brand-orbit" aria-hidden="true">
        <span />
      </span>
      <span>AI Character Galaxy</span>
    </Link>
  );
}
