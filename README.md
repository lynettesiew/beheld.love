# BeHeld

Landing page for BeHeld — designed for closeness, not contacts.

A small-room gathering in NYC built on what the science actually says creates connection.

## Stack

Plain HTML, CSS, and a sprinkle of JavaScript. No build step. Deploys anywhere static.

## Structure

```
beheld-site/
├── index.html          # The landing page
├── css/
│   ├── tokens.css      # Design tokens (colors, fonts, spacing)
│   ├── base.css        # Reset, typography, utilities
│   └── styles.css      # Component & section styles
├── js/
│   └── main.js         # Interactions (FAQ toggles, smooth scroll)
├── assets/             # Images, favicons, OG images go here
├── .gitignore
└── README.md
```

## Local development

Just open `index.html` in a browser. No build, no server needed.

For live reload while editing, you can run any static server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve

# VS Code
# Use the "Live Server" extension
```

## Deploying

This is a static site — drop it anywhere:

- **GitHub Pages** — push to `main`, enable Pages in Settings → Pages
- **Vercel** — import the repo, no config needed
- **Netlify** — drag the folder into the Netlify dashboard
- **Cloudflare Pages** — connect the repo

## Editing

- **Copy changes** → `index.html`
- **Color or font changes** → `css/tokens.css`
- **Adding a new section** → write the HTML in `index.html`, style in `css/styles.css`
- **New interactions** → add to `js/main.js`

## Brand tokens

All colors, fonts, and spacing live in `css/tokens.css` as CSS custom properties. Change them once, they update everywhere.

## When to migrate to a framework

Stay on plain HTML until you need:
- A blog or case study collection (10+ pages)
- Dynamic content from a CMS
- Form state beyond external Tally/Luma links
- Authentication or user accounts

When that day comes, **Next.js** or **Astro** are the natural next steps. Your CSS tokens and component patterns will port over cleanly.

## Links

- Single evening RSVP: https://luma.com/2h9ctlkt
- Apply to The Circle: https://tally.so/r/MedLGX