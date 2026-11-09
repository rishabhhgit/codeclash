import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { ThemeProvider } from '../lib/theme/ThemeContext';
import ThemeToggle from '../components/theme/ThemeToggle';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'CodeClash - Multiplayer Coding Battleground & Friend Practice Arena',
  description: 'Practice 3,600+ LeetCode problems with deep editorials, test against 50-100 test cases, and battle your friends in real-time 1v1 synchronized coding duels.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} ${mono.variable} min-h-screen antialiased bg-background text-foreground transition-colors duration-150`}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-40">
              <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2.5 group">
                    <span className="w-7 h-7 rounded-md bg-secondary text-foreground flex items-center justify-center font-mono font-medium text-xs border border-border group-hover:border-foreground/40 transition-colors">
                      cc
                    </span>
                    <span className="font-semibold text-sm tracking-tight text-foreground">CodeClash</span>
                  </Link>

                  <nav className="hidden md:flex items-center gap-1 text-sm">
                    <Link
                      href="/problems"
                      className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Problems
                    </Link>
                    <Link
                      href="/lobby"
                      className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Arena
                    </Link>
                    <Link
                      href="/battle/join"
                      className="px-3 py-1.5 rounded-md text-primary font-semibold hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                    >
                      <span>Join Battle</span>
                    </Link>
                    <Link
                      href="/battle/create?mode=battle_royale"
                      className="px-3 py-1.5 rounded-md text-primary font-semibold hover:bg-primary/10 transition-colors"
                    >
                      Knockout Arena
                    </Link>
                    <Link
                      href="/battle/create"
                      className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Challenge Friends
                    </Link>
                    <Link
                      href="/rankings"
                      className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Leaderboard
                    </Link>
                  </nav>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href="/problems"
                    className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    3,600+ Questions
                  </Link>

                  <ThemeToggle />

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary hover:bg-muted border border-border text-xs font-medium text-foreground transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-mono">Dashboard</span>
                  </Link>
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
