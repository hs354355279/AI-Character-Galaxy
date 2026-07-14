import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found site-shell">
      <p className="eyebrow">Lost constellation</p>
      <h1 className="display-title">This lesson could not be found.</h1>
      <p className="body-copy">
        The link may be outdated, or the lesson pack did not pass validation.
      </p>
      <Link className="primary-action pressable" href="/">
        Return home
      </Link>
    </main>
  );
}
