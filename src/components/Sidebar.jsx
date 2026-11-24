import Logo from './Logo';

const LINKS = [
  ['timer', 'Timer', <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>],
  ['race', 'Race', <><path d="M4 19V5m0 0h13l-2 4 2 4H4" /><path d="M8 15h12" /></>],
  ['trainer', 'Trainer', <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>],
  ['statistics', 'Statistics', <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />],
  ['prefs', 'Settings', <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>]
];
export default function Sidebar({ page }) {
  return (
    <aside className="side">
      <Logo />
      <nav className="nav" id="nav">
        {LINKS.map(([id, label, icon]) => (
          <a key={id} href={`#${id}`} className={page === id ? 'on' : ''} aria-current={page === id ? 'page' : undefined}>
            <svg className="i" viewBox="0 0 24 24">{icon}</svg>{label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
