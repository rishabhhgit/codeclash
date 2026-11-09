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
            <header className="border-b border-border/70 bg-background/85 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
              <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2.5 group active:scale-[0.96] transition-transform">
                    <span className="size-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono font-bold text-xs group-hover:border-primary/50 group-hover:bg-primary/20 transition-all shadow-sm">
                      cc
                    </span>
                    <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                      CodeClash
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-muted text-muted-foreground border border-border">
                        PRO
                      </span>
                    </span>
                  </Link>

                  <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                    <Link
                      href="/problems"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Problems
                    </Link>
                    <Link
                      href="/lobby"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Arena
                    </Link>
                    <Link
                      href="/battle/join"
                      className="px-3 py-1.5 rounded-lg text-primary font-semibold hover:bg-primary/10 transition-colors duration-150 active:scale-[0.96] flex items-center gap-1.5"
                    >
                      <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full size-2 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                      </span>
                      <span>Join Battle</span>
                    </Link>
                    <Link
                      href="/battle/create?mode=battle_royale"
                      className="px-3 py-1.5 rounded-lg text-amber-400 font-semibold hover:bg-amber-500/10 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Knockout Arena
                    </Link>
                    <Link
                      href="/battle/create"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Challenge Friends
                    </Link>
                    <Link
                      href="/rankings"
                      className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 active:scale-[0.96]"
                    >
                      Leaderboard
                    </Link>
                  </nav>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href="/problems"
                    className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-150 tabular-nums active:scale-[0.96]"
                  >
                    3,129 Questions
                  </Link>

                  <ThemeToggle />

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted border border-border/80 text-xs font-medium text-foreground transition-all duration-150 active:scale-[0.96] shadow-sm"
                  >
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    </span>
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
