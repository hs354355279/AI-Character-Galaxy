export function RelationshipAxesLegend({ targetName }: { targetName: string }) {
  return (
    <aside
      className="relationship-axes-legend"
      role="note"
      aria-label="Relationship space axes"
    >
      <p>Semantic relationship space</p>
      <strong>{targetName} is the origin</strong>
      <dl>
        <div><dt>Radius</dt><dd>near / far · relationship strength</dd></div>
        <div><dt>Vertical</dt><dd>affinity / conflict</dd></div>
        <div><dt>Depth</dt><dd>personal / public</dd></div>
        <div><dt>Direction</dt><dd>incoming / outgoing</dd></div>
      </dl>
    </aside>
  );
}
