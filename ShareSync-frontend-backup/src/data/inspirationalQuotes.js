// src/data/inspirationalQuotes.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Inspirational quotes for Creator-mode celebrations
// ~50 short quotes focused on creativity, shipping, momentum, and craft
// ═══════════════════════════════════════════════════════════════════════════════

const quotes = [
  // ── Shipping & Making ──────────────────────────────────────────────────
  { text: "Ship it. Learn from it. Ship again.", author: null },
  { text: "Done is better than perfect.", author: null },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Every master was once a disaster.", author: null },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },

  // ── Momentum & Progress ────────────────────────────────────────────────
  { text: "Small steps every day lead to big results.", author: null },
  { text: "Progress, not perfection.", author: null },
  { text: "Momentum is everything. Never stop moving.", author: null },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "A year from now you'll wish you had started today.", author: "Karen Lamb" },

  // ── Focus & Deep Work ──────────────────────────────────────────────────
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "Deep work is the superpower of the 21st century.", author: null },
  { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
  { text: "The successful warrior is the average person with laser-like focus.", author: "Bruce Lee" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Do less, but do it better.", author: null },
  { text: "Starve your distractions. Feed your focus.", author: null },
  { text: "One thing at a time. Most important thing first.", author: null },

  // ── Creativity & Craft ─────────────────────────────────────────────────
  { text: "Every artist was first an amateur.", author: "Ralph Waldo Emerson" },
  { text: "Create with the heart; build with the mind.", author: "Criss Jami" },
  { text: "The desire to create is one of the deepest yearnings of the soul.", author: "Dieter F. Uchtdorf" },
  { text: "Art is not what you see, but what you make others see.", author: "Edgar Degas" },
  { text: "Have no fear of perfection — you'll never reach it.", author: "Salvador Dalí" },
  { text: "Imagination is the beginning of creation.", author: "George Bernard Shaw" },
  { text: "To create, one must first question everything.", author: "Eileen Gray" },
  { text: "Make something wonderful and put it out there.", author: "Steve Jobs" },

  // ── Resilience & Grit ──────────────────────────────────────────────────
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Difficult roads often lead to beautiful destinations.", author: null },
  { text: "The comeback is always stronger than the setback.", author: null },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "Your limitation — it's only your imagination.", author: null },
  { text: "Great things never come from comfort zones.", author: null },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },

  // ── Team & Collaboration ───────────────────────────────────────────────
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb" },
  { text: "None of us is as smart as all of us.", author: "Ken Blanchard" },
  { text: "Collaboration is the essence of life.", author: null },

  // ── Growth Mindset ─────────────────────────────────────────────────────
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Growth is never by mere chance; it is the result of forces working together.", author: "James Cash Penney" },
  { text: "Be not afraid of growing slowly, be afraid only of standing still.", author: "Chinese Proverb" },
  { text: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
  { text: "You are never too old to set a new goal or dream a new dream.", author: "C.S. Lewis" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
];

// ── Helper: Get a random quote ───────────────────────────────────────────
export function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// ── Helper: Get a quote by index ─────────────────────────────────────────
export function getQuoteByIndex(index) {
  return quotes[index % quotes.length];
}

// ── Helper: Get quotes by category keyword ───────────────────────────────
export function getQuotesByKeyword(keyword) {
  const lower = keyword.toLowerCase();
  return quotes.filter(
    (q) =>
      q.text.toLowerCase().includes(lower) ||
      (q.author && q.author.toLowerCase().includes(lower))
  );
}

export default quotes;
