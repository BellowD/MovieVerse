// MovieVerse - Global Application Core Script
// Features: Theme Switcher, Accent Colors, Web Audio Sound Effects, Toast Notifications,
// Animated Counters, Scroll Progress, Dynamic Quotes & Collection Filters.
// Authors: Nurkhat Assan, Daurenbek Anuar

window.MovieVerse = window.MovieVerse || {};

(function () {
    const MV = window.MovieVerse;

    // Storage Keys
    const THEME_KEY = "movieverse-theme";
    const ACCENT_KEY = "movieverse-accent";
    const SOUND_KEY = "movieverse-sound";

    // ==========================================
    // 1. STORAGE UTILITIES
    // ==========================================
    MV.readText = function (key, fallback = "") {
        try {
            const val = localStorage.getItem(key);
            return val !== null ? val : fallback;
        } catch (e) {
            return fallback;
        }
    };

    MV.writeText = function (key, value) {
        try {
            localStorage.setItem(key, String(value));
            return true;
        } catch (e) {
            return false;
        }
    };

    MV.removeItem = function (key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {}
    };

    MV.readJSON = function (key, fallback = []) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    };

    MV.writeJSON = function (key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    };

    // ==========================================
    // 2. TACTILE UI SOUND EFFECTS (Web Audio API)
    // Subtle, natural mechanical haptic clicks (non-arcade, non-synth)
    // ==========================================
    const AudioEngine = (function () {
        let ctx = null;
        let isMuted = MV.readText(SOUND_KEY) === "muted";

        function getContext() {
            if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (ctx && ctx.state === "suspended") {
                ctx.resume();
            }
            return ctx;
        }

        function triggerMechanicalTap(pitch = 180, duration = 0.012, gainLevel = 0.035) {
            if (isMuted) return;
            try {
                const c = getContext();
                if (!c) return;

                const osc = c.createOscillator();
                const gain = c.createGain();

                osc.type = "sine";
                // Rapid frequency drop emulates physical switch transient
                osc.frequency.setValueAtTime(pitch, c.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + duration);

                gain.gain.setValueAtTime(gainLevel, c.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);

                osc.connect(gain);
                gain.connect(c.destination);

                osc.start(c.currentTime);
                osc.stop(c.currentTime + duration);
            } catch (e) {}
        }

        return {
            play: function (soundName) {
                if (isMuted) return;
                if (soundName === "click") {
                    triggerMechanicalTap(160, 0.012, 0.035);
                } else if (soundName === "success") {
                    // Soft double micro-tap
                    triggerMechanicalTap(180, 0.010, 0.03);
                    setTimeout(() => triggerMechanicalTap(220, 0.010, 0.03), 45);
                } else if (soundName === "error") {
                    // Muted low-frequency haptic thud
                    triggerMechanicalTap(90, 0.025, 0.04);
                }
            },
            toggleMute: function () {
                isMuted = !isMuted;
                MV.writeText(SOUND_KEY, isMuted ? "muted" : "active");
                return isMuted;
            },
            isMuted: function () {
                return isMuted;
            }
        };
    })();

    MV.sound = AudioEngine;

    // ==========================================
    // 3. TOAST NOTIFICATIONS
    // ==========================================
    MV.showToast = function (message, type = "info") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `toast ${type === "error" ? "toast-error" : type === "success" ? "toast-success" : ""}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(20px)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    };

    // ==========================================
    // 4. THEME & ACCENT SWITCHER
    // ==========================================
    function initTheme() {
        const themeBtn = document.getElementById("change-background");
        const root = document.documentElement;

        function updateThemeText() {
            if (themeBtn) {
                const isLight = root.classList.contains("light-theme");
                themeBtn.textContent = isLight ? "Dark Theme" : "Light Theme";
            }
        }

        updateThemeText();

        if (themeBtn) {
            themeBtn.addEventListener("click", function () {
                const isLight = root.classList.toggle("light-theme");
                MV.writeText(THEME_KEY, isLight ? "light" : "dark");
                updateThemeText();
                MV.sound.play("click");
                MV.showToast(isLight ? "Switched to Light Theme" : "Switched to Dark Theme");
            });
        }

        // Accent palette
        const accentToggleBtn = document.getElementById("accent-toggle");
        const accentPanel = document.getElementById("accent-panel");
        const swatches = document.querySelectorAll(".accent-swatch");

        if (accentToggleBtn && accentPanel) {
            accentToggleBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                const isExpanded = accentToggleBtn.getAttribute("aria-expanded") === "true";
                accentToggleBtn.setAttribute("aria-expanded", String(!isExpanded));
                accentPanel.hidden = isExpanded;
            });

            document.addEventListener("click", function (e) {
                if (!accentPanel.contains(e.target) && e.target !== accentToggleBtn) {
                    accentPanel.hidden = true;
                    accentToggleBtn.setAttribute("aria-expanded", "false");
                }
            });

            swatches.forEach(swatch => {
                swatch.addEventListener("click", function () {
                    const chosen = this.dataset.accent;
                    root.setAttribute("data-accent", chosen);
                    MV.writeText(ACCENT_KEY, chosen);
                    swatches.forEach(s => s.setAttribute("aria-pressed", s === swatch ? "true" : "false"));
                    accentPanel.hidden = true;
                    accentToggleBtn.setAttribute("aria-expanded", "false");
                    MV.sound.play("click");
                    MV.showToast(`Accent color changed to ${chosen}`);
                });
            });
        }

        // Sound toggle button
        const soundBtn = document.getElementById("sound-toggle");
        if (soundBtn) {
            function updateSoundIcon(muted) {
                soundBtn.setAttribute("aria-pressed", String(muted));
                const onIcon = soundBtn.querySelector(".icon-sound-on");
                const offIcon = soundBtn.querySelector(".icon-sound-off");
                if (onIcon && offIcon) {
                    onIcon.style.display = muted ? "none" : "block";
                    offIcon.style.display = muted ? "block" : "none";
                }
            }

            updateSoundIcon(MV.sound.isMuted());

            soundBtn.addEventListener("click", function () {
                const muted = MV.sound.toggleMute();
                updateSoundIcon(muted);
                MV.showToast(muted ? "Sound muted" : "Sound enabled");
            });
        }
    }

    // ==========================================
    // 5. AUTH STATE IN HEADER
    // ==========================================
    MV.renderAuthState = function () {
        const authSlot = document.getElementById("nav-auth");
        if (!authSlot) return;

        const user = MV.getCurrentUser ? MV.getCurrentUser() : null;
        authSlot.innerHTML = "";

        if (user) {
            const firstName = user.name ? user.name.split(" ")[0] : "Account";
            authSlot.innerHTML = `
                <a href="profile.html" style="color: var(--accent); font-weight: bold;">${firstName}</a>
                <button type="button" class="auth-logout" id="header-logout-btn">Log Out</button>
            `;
            const headerLogout = document.getElementById("header-logout-btn");
            if (headerLogout) {
                headerLogout.addEventListener("click", MV.logOut);
            }
        } else {
            authSlot.innerHTML = `
                <a href="login.html">Log In</a>
                <a href="signup.html" class="btn" style="padding: 5px 12px; font-size: 0.85rem;">Sign Up</a>
            `;
        }
    };

    // ==========================================
    // 6. SCROLL PROGRESS BAR
    // ==========================================
    function initScrollProgress() {
        const bar = document.getElementById("scroll-progress-bar");
        if (!bar) return;

        window.addEventListener("scroll", function () {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            bar.style.width = pct + "%";
        });
    }

    // ==========================================
    // 7. ANIMATED STATISTICS COUNTER
    // ==========================================
    function initAnimatedCounters() {
        const counters = document.querySelectorAll(".counter-value");
        if (!counters.length) return;

        let hasRun = false;

        function runCounters() {
            if (hasRun) return;
            counters.forEach(counter => {
                const target = parseInt(counter.dataset.target, 10) || 0;
                const suffix = counter.dataset.suffix || "";
                const duration = 1500;
                const startTime = performance.now();

                function update(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // Ease out quadratic
                    const easeProgress = 1 - (1 - progress) * (1 - progress);
                    const current = Math.floor(easeProgress * target);

                    counter.textContent = current + suffix;

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        counter.textContent = target + suffix;
                    }
                }
                requestAnimationFrame(update);
            });
            hasRun = true;
        }

        // Trigger on visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    runCounters();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.2 });

        const statsSection = document.querySelector(".stats-section");
        if (statsSection) {
            observer.observe(statsSection);
        } else {
            runCounters();
        }
    }

    // ==========================================
    // 8. HOME PAGE GREETING & QUOTE BOX
    // ==========================================
    function initGreeting() {
        const greetingEl = document.getElementById("time-greeting");
        if (!greetingEl) return;

        const hour = new Date().getHours();
        let greeting = "Welcome to MovieVerse!";

        if (hour >= 5 && hour < 12) {
            greeting = "Good Morning, Cinephile!";
        } else if (hour >= 12 && hour < 17) {
            greeting = "Good Afternoon, Cinephile!";
        } else if (hour >= 17 && hour < 22) {
            greeting = "Good Evening, Cinephile!";
        } else {
            greeting = "Late Night Movie Time!";
        }

        const user = MV.getCurrentUser ? MV.getCurrentUser() : null;
        if (user) {
            greeting += ` (${user.name.split(" ")[0]})`;
        }

        greetingEl.textContent = greeting;
    }

    function initQuotes() {
        const quotes = [
            { text: "May the Force be with you.", movie: "Star Wars", year: "1977" },
            { text: "There's no place like home.", movie: "The Wizard of Oz", year: "1939" },
            { text: "I'm going to make him an offer he can't refuse.", movie: "The Godfather", year: "1972" },
            { text: "Here's looking at you, kid.", movie: "Casablanca", year: "1942" },
            { text: "You're gonna need a bigger boat.", movie: "Jaws", year: "1975" },
            { text: "I'll be back.", movie: "The Terminator", year: "1984" },
            { text: "Life is like a box of chocolates. You never know what you're gonna get.", movie: "Forrest Gump", year: "1994" },
            { text: "Why so serious?", movie: "The Dark Knight", year: "2008" },
            { text: "Do, or do not. There is no try.", movie: "The Empire Strikes Back", year: "1980" },
            { text: "To infinity and beyond!", movie: "Toy Story", year: "1995" },
            { text: "Inception is real. An idea can transform the world.", movie: "Inception", year: "2010" }
        ];

        const quoteTextEl = document.getElementById("quote-text");
        const quoteMovieEl = document.getElementById("quote-movie");
        const newQuoteBtn = document.getElementById("new-quote-btn");
        const copyBtn = document.querySelector(".copy-btn[data-copy-target='#quote-text']");

        function setQuote(q) {
            if (quoteTextEl) {
                quoteTextEl.innerHTML = `"${q.text}" — <strong id="quote-movie" style="color: var(--accent);">${q.movie} (${q.year})</strong>`;
            }
        }

        if (newQuoteBtn) {
            newQuoteBtn.addEventListener("click", function () {
                const rand = quotes[Math.floor(Math.random() * quotes.length)];
                setQuote(rand);
                MV.sound.play("click");
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener("click", function () {
                const text = quoteTextEl ? quoteTextEl.textContent : "";
                navigator.clipboard.writeText(text).then(() => {
                    MV.sound.play("success");
                    MV.showToast("Quote copied to clipboard!");
                }).catch(() => {
                    MV.showToast("Failed to copy quote", "error");
                });
            });
        }
    }

    // ==========================================
    // 9. HOME GENRE FILTER
    // ==========================================
    function initGenreFilter() {
        const filterBtns = document.querySelectorAll(".filter-bar .filter-btn");
        const cards = document.querySelectorAll("#movie-grid .movie-card");

        if (!filterBtns.length || !cards.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener("click", function () {
                filterBtns.forEach(b => b.classList.remove("active"));
                this.classList.add("active");

                const genre = this.dataset.genre || "all";
                cards.forEach(card => {
                    const cardGenres = (card.dataset.genre || "").toLowerCase();
                    if (genre === "all" || cardGenres.includes(genre.toLowerCase())) {
                        card.style.display = "flex";
                    } else {
                        card.style.display = "none";
                    }
                });

                MV.sound.play("click");
            });
        });
    }

    // Initialize everything on DOMContentLoaded
    document.addEventListener("DOMContentLoaded", function () {
        initTheme();
        initScrollProgress();
        MV.renderAuthState();
        initGreeting();
        initAnimatedCounters();
        initQuotes();
        initGenreFilter();

        // Generic button click sound
        document.addEventListener("click", function (e) {
            if (e.target.closest("button, .btn, .nav-links a")) {
                MV.sound.play("click");
            }
        });
    });
})();
