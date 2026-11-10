import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { Swords } from 'lucide-react';
import { CodeClashLogo } from '../components/ui/CodeClashLogo';
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
            <header className="border-b border-border/70 bg-background/85 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
              <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2.5 group">
                    <span className="size-8 rounded-lg bg-secondary/80 border border-border text-foreground flex items-center justify-center transition-colors group-hover:border-foreground/30 shadow-xs">
                      <CodeClashLogo size={22} />
                    </span>
                    <span className="font-bold text-base tracking-tight text-foreground">
                      CodeClash
                    </span>
                  </Link>

                  <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                    <Link
                      href="/matchmaking"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Compete
                    </Link>
                    <Link
                      href="/lobby"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Arena
                    </Link>
                    <Link
                      href="/roadmap"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Roadmap
                    </Link>
                    <Link
                      href="/problems"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Problems
                    </Link>
                    <Link
                      href="/rankings"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Leaderboard
                    </Link>
                    <Link
                      href="/leetcode-profiles"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96] flex items-center gap-1.5"
                    >
                      <span className="size-1.5 rounded-full bg-amber-400" />
                      <span>Profiles</span>
                    </Link>
                  </nav>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/battle/join"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/80 text-xs font-mono font-medium text-foreground transition-all duration-150 active:scale-[0.96]"
                  >
                    <span># Enter Code</span>
                  </Link>

                  <Link
                    href="/auth/register"
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium text-amber-400 transition-all duration-150 active:scale-[0.96]"
                  >
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    <span>LeetCode Sync</span>
                  </Link>

                  <ThemeToggle />

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted border border-border text-xs font-medium text-foreground transition-colors"
                  >
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Dashboard</span>
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
