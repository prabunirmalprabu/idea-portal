"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/ideas", label: "Ideas" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/admin", label: "Admin" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/ideas" className="text-lg font-semibold text-brand-700">
          Idea Portal
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                pathname?.startsWith(link.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
