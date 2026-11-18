# 🎬 MovieVerse — Final Web Project

MovieVerse is an interactive multi-page movie web platform built with semantic HTML5, modern CSS3 (Flexbox & CSS Grid), vanilla JavaScript (ES6+), and local jQuery. The application integrates with the live **OMDb Public API** to provide search across thousands of international movies and TV shows, personal watchlist curation with priority queue reordering, 1–5 star ratings, and simulated authentication using client-side `localStorage`.

---

## 📌 Project Overview

- **Project Title:** MovieVerse
- **Course:** Web Development (Final Exam Project)
- **Group:** SE-2514
- **Team Members & Work Division:**
  - **Nurkhat Assan:** Home page (`index.html`), Curated collection (21 films), Simulated authentication (`login.html`, `signup.html`), Client-side form validation engine (`js/validation.js`), Profile view & settings (`profile.html`), Light/Dark theme system & CSS tokens.
  - **Daurenbek Anuar:** Search page (`movie.html`), Live OMDb API integration with async/await (`js/api.js`), Autocomplete suggestions, Watchlist management & priority reordering (`favorites.html`, `js/favorites.js`), Movie details modal & ratings.
  - **Collaborative:** About page (`about.html`), Contact form (`contact.html`), CSS responsiveness, cross-device testing, documentation.

---

## 🚀 Key Features & Requirements Alignment

| Requirement | Points | Implementation in MovieVerse |
|---|---|---|
| **1. Responsiveness** | 10 pts | CSS Grid page areas (`header`, `sidebar`, `main`, `footer`) + Flexbox alignment. Breakpoints at 1024px, 820px, and 520px. Tested on mobile, tablet, and desktop without overlaps or cut-offs. |
| **2. Hosting** | 5 pts | Fully relative links and static structure ready for GitHub Pages, Netlify, or Vercel. Zero broken links or 404 errors. |
| **3. Light & Dark Modes** | 5 pts | Dedicated toggle switch (`#change-background`) in header. Persisted in `localStorage` (`movieverse-theme`). Early execution script in `<head>` prevents FOUC (flash of wrong theme). Complies with WCAG contrast standards. Bonus: 4 accent palettes (Sky, Crimson, Gold, Emerald). |
| **4. Design & UX** | 20 pts | 8 connected and functional pages (Home, Search, Favorites, Profile, Login, Signup, About, Contact). Cohesive cinema theme, 21 local posters, typography hierarchy, and clear target audience. |
| **5. Enhanced JS: Auth** | 10 pts | Simulated Sign Up storing user credentials, phone, and metadata in `localStorage`. Log In validating credentials and redirecting to Profile. Profile route protection and session clearing on logout. |
| **6. Enhanced JS: Validation** | 10 pts | Strict client-side validation (`js/validation.js`): Email regex, KZ phone pattern (`+7 7XX XXX XX XX` or `8 7XX XXX XX XX`), password complexity (min 8 chars, uppercase, lowercase, digit, special char). User-friendly inline error messages with `aria-invalid` and `aria-describedby`. `<form novalidate>` on all forms with **ZERO** default HTML validation attributes. |
| **7. Enhanced JS: Search/Filter** | 5 pts | Dynamic genre filtering on Home page; priority reordering and search on Favorites page; search history chips saved in `localStorage`. |
| **8. Animated UI Effects** | 5 pts | Smooth CSS transitions on cards and modals, toast notifications, scroll progress bar, animated counters, and Web Audio API synthesized tones (click, success, error) with mute switch. |
| **9. External API Integration** | 10 pts | Real-time OMDb API connection (`https://www.omdbapi.com/`, API key `7e7c63b6`) using `fetch()` and `async/await`. Request debouncing (350ms), loading state spinners, error handling, network retry button, and interactive details modal with 1–5 star rating widget. |
| **10. Code Quality & Structure** | 5 pts | Clean modular code organization, semantic tags, meaningful identifiers, well-commented logic. |

---

## 📁 Project File Structure

```text
MovieVerse/
├── index.html                   # Home: Greeting, community stats, 21-film collection, quotes
├── movie.html                   # Search: Live OMDb API search, autocomplete, modal details
├── favorites.html               # Favorites: Watchlist with ↑ Up / ↓ Down priority reordering
├── profile.html                 # Profile: User info, rated films history, profile settings
├── login.html                   # Log In: Credential check, auth simulation, demo credentials
├── signup.html                  # Sign Up: New user registration with strict JS validation
├── about.html                   # About: Project mission, target audience, team division, tech stack
├── contact.html                 # Contact: Feedback form with live character counter (500 chars)
├── README.md                    # Project documentation
├── MovieVerse_SE2514_Links.txt  # Repository and live hosting links
├── css/
│   └── style.css                # CSS variables, responsive Grid/Flexbox, light/dark themes
├── js/
│   ├── jquery-4.0.0.min.js      # Local jQuery library
│   ├── script.js                # Core app logic: theme, audio synthesis, toast, quotes, stats
│   ├── validation.js            # Validation engine: regex, inline errors, novalidate enforcement
│   ├── auth.js                  # Authentication simulation, profile management, contact form
│   ├── favorites.js             # Watchlist storage, priority ordering, star ratings, sync
│   └── api.js                   # OMDb API handler, async/await, debouncing, modal details
└── images/                      # 21 high-resolution posters + profile avatar
```

---

## 💻 How to Run Locally

You can open the static HTML files directly in any modern browser, or serve them locally:

```bash
# Using Python built-in HTTP server:
python -m http.server 8000

# Then open in browser:
http://localhost:8000/
```

Or using the VS Code **Live Server** extension on `index.html`.

---

## 🌐 Online Links

- **GitHub Repository:** [https://github.com/BellowD/MovieVerse](https://github.com/BellowD/MovieVerse)
- **Live Website:** [https://bellowd.github.io/MovieVerse/](https://bellowd.github.io/MovieVerse/)
