'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import '@/app/globals.css';

const navLinks = [
  { href: '/dashboard', label: '📊 Dashboard' },
  { href: '/upload', label: '📤 Upload' },
  { href: '/dashboard/history', label: '📁 History' },
  { href: '/dashboard/settings', label: '⚙️ Settings' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body className="bg-zinc-900 text-zinc-100 min-h-screen">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-zinc-950 p-4 border-r border-zinc-800 flex flex-col justify-between">
            <div>
              <h1 className="text-xl font-bold text-white mb-6">🚀 TCG Ship</h1>
              <nav className="space-y-2">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`block px-4 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium ${
                      pathname === href ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            <button
              onClick={() => signOut(auth)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Sign Out
            </button>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">
            <header className="mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-white">VaultTrove Shipping</h2>
              <p className="text-sm text-zinc-400">Manage labels, batches, and shipping tools with ease.</p>
            </header>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
