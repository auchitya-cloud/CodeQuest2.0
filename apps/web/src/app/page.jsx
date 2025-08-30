'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from "next/link";
import { Moon, Sun, ChevronLeft, ChevronRight, TerminalSquare, BookOpen, MessageSquare, ListChecks, UserCheck, Flame } from 'lucide-react';

// --- simple theme hook (no external provider) ---
function useTheme() {
  const [theme, setTheme] = React.useState('system');

  React.useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('theme');
    if (stored) setTheme(stored);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
    if (theme) localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

// --- tiny UI primitives (swap with shadcn/ui later) ---
const Button = ({ className = '', children, ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium shadow-sm transition active:scale-[0.98] border border-zinc-200/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/70 dark:bg-zinc-900/70 backdrop-blur shadow-sm ${className}`}>{children}</div>
);

const Container = ({ className = '', children }) => (
  <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

// --- carousel data ---
const slides = [
  {
    title: 'Master DSA with Visual Insight',
    subtitle: 'Step-by-step algorithm animations, clean explanations, and curated problems.',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop',
    cta: 'Start Learning'
  },
  {
    title: 'Code • Discuss • Grow',
    subtitle: 'Monaco editor, forums, and study plans that adapt to you.',
    image:
      'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1600&auto=format&fit=crop',
    cta: 'Join the Community'
  },
  {
    title: 'Track Progress Across Platforms',
    subtitle: 'LeetCode & Codeforces sync, heatmaps, and contest insights.',
    image:
      'https://thumb.tildacdn.com/tild6532-3231-4234-a330-353236343933/-/resize/652x/-/format/webp/839209.jpg',
    cta: 'Connect Profiles'
  }
];

function useCarousel(length, interval = 6000) {
  const [index, setIndex] = React.useState(0);
  const timeout = React.useRef(null);

  const next = React.useCallback(() => setIndex((i) => (i + 1) % length), [length]);
  const prev = React.useCallback(() => setIndex((i) => (i - 1 + length) % length), [length]);

  React.useEffect(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(next, interval);
    return () => clearTimeout(timeout.current);
  }, [index, next, interval]);

  return { index, setIndex, next, prev };
}

// --- Navbar ---
function Navbar({ theme, setTheme }) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-white/70 dark:bg-zinc-950/60 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <TerminalSquare className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">CodeQuest</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-300">
          <Link href="/visualizer" className="hover:text-zinc-900 dark:hover:text-zinc-50">Visualizer</Link>
          <Link href="/questions" className="hover:text-zinc-900 dark:hover:text-zinc-50">Questions</Link>
          <Link href="/forum" className="hover:text-zinc-900 dark:hover:text-zinc-50">Forum</Link>
          <Link href="/profile" className="hover:text-zinc-900 dark:hover:text-zinc-50">Profile</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </Button>
          <Button className="bg-emerald-600/90 text-white border-emerald-700 hover:bg-emerald-600">Sign In</Button>
        </div>
      </Container>
    </header>
  );
}

// --- Hero + Carousel ---
function HeroCarousel() {
  const { index, setIndex, next, prev } = useCarousel(slides.length, 7000);

  return (
    <section className="relative">
      <div className="relative h-[56vh] sm:h-[64vh] w-full overflow-hidden rounded-none">
        <AnimatePresence mode="wait">
          {slides.map((s, i) => (
            i === index && (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${s.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-white/10 dark:from-zinc-950 dark:via-zinc-950/40 dark:to-zinc-950/10" />
                <Container className="relative h-full flex items-end pb-12">
                  <div className="max-w-3xl">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {s.title}
                    </h1>
                    <p className="mt-3 text-zinc-700 dark:text-zinc-300 text-base sm:text-lg">
                      {s.subtitle}
                    </p>
                    <div className="mt-6 flex gap-3">
                      <Link href="/visualizer">
                        <button className="btn btn-accent">
                          {s.cta}
                        </button>
                      </Link>
                      <Button className="border-zinc-300/80 dark:border-zinc-700/80">Explore Features</Button>
                    </div>
                  </div>
                </Container>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {/* controls */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
          <Button className="pointer-events-auto bg-white/70 dark:bg-zinc-900/70" onClick={prev} aria-label="Previous slide">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button className="pointer-events-auto bg-white/70 dark:bg-zinc-900/70" onClick={next} aria-label="Next slide">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full border border-zinc-400/60 dark:border-zinc-600/60 transition ${
                i === index ? 'bg-emerald-600/90 border-emerald-700' : 'bg-white/60 dark:bg-zinc-800/60'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Feature grid ---
function FeatureGrid() {
  const items = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: 'DSA Visualiser',
      desc: 'Clean, step-by-step animations for arrays, trees, graphs, DP, and more.'
    },
    {
      icon: <TerminalSquare className="h-5 w-5" />,
      title: 'Monaco IDE',
      desc: 'Code with IntelliSense-like hints, test cases, and instant feedback.'
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Chat & Forums',
      desc: 'Discuss problems, share insights, and learn together in real time.'
    },
    {
      icon: <ListChecks className="h-5 w-5" />,
      title: 'Question Lists',
      desc: 'Import CSVs, curate sets, and track completion across topics.'
    },
    {
      icon: <UserCheck className="h-5 w-5" />,
      title: 'Profile Sync',
      desc: 'LeetCode & Codeforces sync, solved counts, and contest stats.'
    },
    {
      icon: <Flame className="h-5 w-5" />,
      title: 'Heatmaps',
      desc: 'Visualize your practice streaks and focus areas with elegant heatmaps.'
    }
  ];

  return (
    <section className="py-12">
      <Container>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, idx) => (
            <Card key={idx} className="transition hover:shadow-md">
              <div className="flex items-start gap-4 p-5">
                <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/60 dark:bg-zinc-900/60 p-2 text-emerald-600 dark:text-emerald-400">
                  {it.icon}
                </div>
                <div>
                  <h3 className="text-zinc-900 dark:text-zinc-50 font-semibold">{it.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{it.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

// --- CTA band ---
function CTA() {
  return (
    <section className="py-10">
      <Container>
        <Card>
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-gradient-to-br from-emerald-100/60 to-emerald-200/40 p-6 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-300/60 dark:border-emerald-700/40">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Ready to level up your DSA?</h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">Create an account, pick a path, and start visualizing complex ideas with clarity.</p>
            <div className="mt-2">
              <Link href="/visualizer">
                <button className="btn btn-accent">Get Started</button>
              </Link>
            </div>
          </div>
        </Card>
      </Container>
    </section>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="mt-8 border-t border-zinc-200/70 dark:border-zinc-800/70">
      <Container className="py-8 text-sm text-zinc-600 dark:text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>© {new Date().getFullYear()} CodeQuest</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Docs</a>
          <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Privacy</a>
          <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Contact</a>
        </nav>
      </Container>
    </footer>
  );
}

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <Navbar theme={theme === 'system' ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme} setTheme={setTheme} />
      <main>
        <HeroCarousel />
        <FeatureGrid />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
