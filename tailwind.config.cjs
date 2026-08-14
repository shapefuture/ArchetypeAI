module.exports = {
  content: [
    './src/**/*.{html,ts}',
    './src/index.html',
  ],
  theme: {
    extend: {
      colors: {
        paper: 'var(--color-paper)',
        'paper-dk': 'var(--color-paper-dk)',
        ink: 'var(--color-ink)',
        'ink-l': 'var(--color-ink-l)',
        coral: 'var(--color-coral)',
        mustard: 'var(--color-mustard)',
        sage: 'var(--color-sage)',
        mint: 'var(--color-mint)',
        sky: 'var(--color-sky)',
        lavender: 'var(--color-lavender)',
        rose: 'var(--color-rose)',
        orange: 'var(--color-orange)',
        dark: 'var(--color-dark)',
        // Used by landing hero "Resume test" button body and results-panel
        // anonymous-save / degraded-banner. Backed by --accent-yellow in
        // design-system.css so the brand palette stays in one place.
        amber: 'var(--accent-yellow)',
        'amber-deep': '#B45309',
      },
    },
  },
  plugins: [],
};
