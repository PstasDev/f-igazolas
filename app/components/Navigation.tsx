'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Főoldal' },
    { href: '/login', label: 'Bejelentkezés' },
  ];

  return (
    <nav className="bg-white dark:bg-[#1f2329] border-b border-[#333C3E]/10 dark:border-[#3a3f4b] transition-colors">
      <div className="max-w-4xl mx-auto px-6">
        <ul className="flex gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-3 text-sm font-medium transition-all duration-300 relative group"
                >
                  <span
                    className={`transition-colors duration-300 ${
                      isActive
                        ? 'text-[#333C3E] dark:text-[#e4e6eb]'
                        : 'text-[#333C3E]/60 dark:text-[#9198a1] group-hover:text-[#333C3E] dark:group-hover:text-[#e4e6eb]'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#333C3E] dark:bg-[#c9a36f] transition-all duration-300 ease-in-out ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
