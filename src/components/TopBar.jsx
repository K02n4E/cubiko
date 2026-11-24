import Logo from './Logo';

/** Phone-only top bar: app name on the left, the puzzle (3x3) on the right. Hidden on desktop by CSS. */
export default function TopBar() {
  return (
    <header className="topbar">
      <Logo />
      <span className="event-chip" aria-label="Puzzle: 3 by 3">3x3</span>
    </header>
  );
}
