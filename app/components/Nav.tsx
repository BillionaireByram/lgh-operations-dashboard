import Link from "next/link";

const links = [
  { href: "/", label: "Overview" },
  { href: "/hot-leads", label: "Hot leads" },
  { href: "/journey", label: "Journey" },
  { href: "/campaigns", label: "Campaigns" },
];

export function Nav() {
  return (
    <nav className="flex items-center gap-1 mb-6 border-b border-white/10 -mx-6 lg:-mx-10 px-6 lg:px-10 pb-3">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="px-3 py-1.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/5"
        >
          {l.label}
        </Link>
      ))}
      <div className="ml-auto text-xs text-white/40">LGH · live</div>
    </nav>
  );
}
