/** Animated dashed-orbit mark — echoes LIV DOT's animated SVG motif. */
export function OrbitMark({ live = false }: { live?: boolean }) {
  const accent = live ? 'var(--accent)' : 'var(--muted)';
  return (
    <svg className="orbit" viewBox="0 0 100 100" aria-hidden>
      <circle
        className="orbit__ring"
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeDasharray="4 7"
        opacity="0.7"
      />
      <circle
        className="orbit__ring orbit__ring--rev"
        cx="50"
        cy="50"
        r="33"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="1"
        strokeDasharray="2 9"
      />
      <g className="orbit__sat">
        <circle cx="50" cy="6" r="3" fill={accent} />
      </g>
      <circle className="orbit__core" cx="50" cy="50" r="6" fill={accent} />
    </svg>
  );
}
