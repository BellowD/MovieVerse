// MovieVerse - Authentication Simulation & Profile Management Module
// Simulates user registration, login verification, session storage, and profile management.
// Authors: Nurkhat Assan, Daurenbek Anuar

window.MovieVerse = window.MovieVerse || {};

(function () {
    const MV = window.MovieVerse;
    const V = MV.validation;

    const USERS_KEY = "movieverse_users";
    const SESSION_KEY = "movieverse_session";

    function getUsers() {
        return MV.readJSON(USERS_KEY, []);
    }

    function saveUsers(users) {
        return MV.writeJSON(USERS_KEY, users);
    }

    function normalizeEmail(email) {
        return (email || "").trim().toLowerCase();
    }

    function findUserByEmail(email, exceptId) {
        const target = normalizeEmail(email);
        return getUsers().find(user => normalizeEmail(user.email) === target && user.id !== exceptId) || null;
    }

    MV.getCurrentUser = function () {
        const sessionId = MV.readText(SESSION_KEY);
        if (!sessionId) return null;
        return getUsers().find(u => u.id === sessionId) || null;
    };

    function startSession(user) {
        MV.writeText(SESSION_KEY, user.id);
        if (MV.favorites && MV.favorites.mergeGuestData) {
            MV.favorites.mergeGuestData(user.id);
        }
        MV.renderAuthState();
    }

    MV.logOut = function () {
        MV.removeItem(SESSION_KEY);
        if (MV.sound) MV.sound.play("click");
        MV.showToast("Logged out successfully");
        MV.renderAuthState();
        setTimeout(function () {
            window.location.href = "login.html";
        }, 300);
    };

    function setFormStatus(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = "form-status " + (type === "success" ? "is-success" : type === "error" ? "is-error" : "");
    }

    function formatDate(isoStr) {
        if (!isoStr) return "—";
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return "—";
        return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }

    // ==========================================
    // 1. SIGN UP PAGE
    // ==========================================
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        const signupRules = {
            "signup-name": V.rules.name("Full name"),
            "signup-email": V.combine(V.rules.email(), function (val) {
                return findUserByEmail(val) ? "An account with this email already exists" : "";
            }),
            "signup-phone": V.rules.phone(),
            "signup-password": V.rules.strongPassword(),
            "signup-confirm": V.combine(V.rules.required("Password confirmation"), function (val, form) {
                const pass = form.querySelector("#signup-password").value;
                return V.passwordsMatch(val, pass) ? "" : "Passwords do not match";
            })
        };

        V.attachLiveValidation(signupForm, signupRules);

        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const statusEl = document.getElementById("signup-status");
            setFormStatus(statusEl, "", null);

            if (!V.validateForm(signupForm, signupRules)) return;

            const newUser = {
                id: "user_" + Date.now(),
                name: signupForm.querySelector("#signup-name").value.trim().replace(/\s+/g, " "),
                email: normalizeEmail(signupForm.querySelector("#signup-email").value),
                phone: signupForm.querySelector("#signup-phone").value.trim(),
                password: signupForm.querySelector("#signup-password").value,
                favoriteGenre: "Sci-Fi",
                bio: "Film enthusiast exploring the universe of cinema on MovieVerse.",
                createdAt: new Date().toISOString()
            };

            const users = getUsers();
            users.push(newUser);
            saveUsers(users);

            startSession(newUser);
            if (MV.sound) MV.sound.play("success");
            MV.showToast("Account created successfully!");
            setTimeout(function () {
                window.location.href = "profile.html";
            }, 600);
        });
    }

    // ==========================================
    // 2. LOG IN PAGE
    // ==========================================
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        const loginRules = {
            "login-email": V.rules.email(),
            "login-password": V.rules.required("Password")
        };

        V.attachLiveValidation(loginForm, loginRules);

        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const errorBox = document.getElementById("login-error");
            if (errorBox) errorBox.textContent = "";

            if (!V.validateForm(loginForm, loginRules)) return;

            const email = loginForm.querySelector("#login-email").value;
            const password = loginForm.querySelector("#login-password").value;
            const user = findUserByEmail(email);

            if (!user || user.password !== password) {
                if (errorBox) errorBox.textContent = "Incorrect email or password. Please check your credentials.";
                if (MV.sound) MV.sound.play("error");
                loginForm.querySelector("#login-password").focus();
                return;
            }

            startSession(user);
            if (MV.sound) MV.sound.play("success");
            MV.showToast("Welcome back, " + user.name.split(" ")[0] + "!");
            setTimeout(function () {
                window.location.href = "profile.html";
            }, 600);
        });
    }

    // ==========================================
    // 3. PROFILE PAGE
    // ==========================================
    const profileContainer = document.getElementById("profile-container");
    if (profileContainer) {
        let currentUser = MV.getCurrentUser();

        // Route guard: if not logged in, redirect to login page
        if (!currentUser) {
            window.location.replace("login.html");
            return;
        }

        const profileForm = document.getElementById("profile-form");
        const profileStatus = document.getElementById("profile-status");
        const nameInput = document.getElementById("profile-name-input");
        const emailInput = document.getElementById("profile-email-input");
        const phoneInput = document.getElementById("profile-phone-input");
        const genreInput = document.getElementById("profile-genre-input");
        const bioInput = document.getElementById("profile-bio-input");

        if (bioInput) {
            V.attachCounter(bioInput, document.getElementById("profile-bio-counter"), 200);
        }

        function renderProfileView() {
            document.getElementById("profile-name-display").textContent = currentUser.name;
            document.getElementById("profile-email-display").textContent = currentUser.email;
            document.getElementById("profile-phone-display").textContent = currentUser.phone || "—";
            document.getElementById("profile-genre-display").textContent = currentUser.favoriteGenre || "Not set";
            document.getElementById("profile-joined-display").textContent = formatDate(currentUser.createdAt);
            document.getElementById("profile-bio-display").textContent = currentUser.bio || "No bio added yet.";

            // Populate form inputs
            if (nameInput) nameInput.value = currentUser.name;
            if (emailInput) emailInput.value = currentUser.email;
            if (phoneInput) phoneInput.value = currentUser.phone || "";
            if (genreInput) genreInput.value = currentUser.favoriteGenre || "Sci-Fi";
            if (bioInput) {
                bioInput.value = currentUser.bio || "";
                bioInput.dispatchEvent(new Event("input"));
            }

            // Stats & Ratings
            renderProfileStats();
        }

        function renderProfileStats() {
            const favs = MV.favorites ? MV.favorites.getAll() : [];
            const ratings = MV.favorites ? MV.favorites.getRatings() : [];

            const favCountEl = document.getElementById("profile-fav-count");
            const ratingCountEl = document.getElementById("profile-rating-count");
            if (favCountEl) favCountEl.textContent = favs.length;
            if (ratingCountEl) ratingCountEl.textContent = ratings.length;

            const tableBody = document.getElementById("profile-ratings-table-body");
            if (!tableBody) return;
            tableBody.innerHTML = "";

            if (ratings.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">No ratings recorded yet. <a href="movie.html" style="color: var(--accent);">Search movies to rate</a>.</td></tr>`;
                return;
            }

            ratings.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${item.title || "Unknown"}</strong> ${item.year ? "(" + item.year + ")" : ""}</td>
                    <td>${item.genre || "—"}</td>
                    <td>${formatDate(item.ratedAt)}</td>
                    <td style="color: #facc15; font-weight: bold;">★ ${item.rating} / 5</td>
                `;
                tableBody.appendChild(tr);
            });
        }

        if (profileForm) {
            const profileRules = {
                "profile-name-input": V.rules.name("Full name"),
                "profile-email-input": V.combine(V.rules.email(), function (val) {
                    return findUserByEmail(val, currentUser.id) ? "An account with this email already exists" : "";
                }),
                "profile-phone-input": V.rules.phone(),
                "profile-bio-input": V.rules.length("Bio", 0, 200)
            };

            V.attachLiveValidation(profileForm, profileRules);

            profileForm.addEventListener("submit", function (e) {
                e.preventDefault();
                setFormStatus(profileStatus, "", null);
                if (!V.validateForm(profileForm, profileRules)) return;

                const submitBtn = profileForm.querySelector('button[type="submit"]');
                const origText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner"></span> Saving...`;

                setTimeout(function () {
                    const users = getUsers();
                    const idx = users.findIndex(u => u.id === currentUser.id);

                    if (idx !== -1) {
                        users[idx] = Object.assign({}, users[idx], {
                            name: nameInput.value.trim().replace(/\s+/g, " "),
                            email: normalizeEmail(emailInput.value),
                            phone: phoneInput.value.trim(),
                            favoriteGenre: genreInput ? genreInput.value : "Sci-Fi",
                            bio: bioInput.value.trim()
                        });
                        saveUsers(users);
                        currentUser = users[idx];
                    }

                    submitBtn.disabled = false;
                    submitBtn.textContent = origText;
                    renderProfileView();
                    MV.renderAuthState();
                    if (MV.sound) MV.sound.play("success");
                    setFormStatus(profileStatus, "Profile updated successfully!", "success");
                    MV.showToast("Profile settings saved");
                }, 600);
            });

            const resetBtn = document.getElementById("profile-reset-btn");
            if (resetBtn) {
                resetBtn.addEventListener("click", function () {
                    renderProfileView();
                    V.clearFormErrors(profileForm);
                    setFormStatus(profileStatus, "Form reset to saved profile data.", "success");
                });
            }
        }

        const logoutBtn = document.getElementById("profile-logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", MV.logOut);
        }

        renderProfileView();
    }

    // ==========================================
    // 4. CONTACT FORM PAGE
    // ==========================================
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        const contactStatus = document.getElementById("contact-status");
        const msgTextarea = document.getElementById("contact-message");
        if (msgTextarea) {
            V.attachCounter(msgTextarea, document.getElementById("contact-message-counter"), 500);
        }

        const contactRules = {
            "contact-name": V.rules.name("Name"),
            "contact-email": V.rules.email(),
            "contact-phone": V.rules.phone(),
            "contact-subject": V.rules.required("Subject"),
            "contact-message": V.combine(V.rules.required("Message"), V.rules.length("Message", 10, 500))
        };

        // Auto-fill logged in user info
        const user = MV.getCurrentUser ? MV.getCurrentUser() : null;
        if (user) {
            const n = contactForm.querySelector("#contact-name");
            const em = contactForm.querySelector("#contact-email");
            const ph = contactForm.querySelector("#contact-phone");
            if (n) n.value = user.name;
            if (em) em.value = user.email;
            if (ph) ph.value = user.phone || "";
        }

        V.attachLiveValidation(contactForm, contactRules);

        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();
            setFormStatus(contactStatus, "", null);
            if (!V.validateForm(contactForm, contactRules)) return;

            const name = contactForm.querySelector("#contact-name").value.trim();
            const email = normalizeEmail(contactForm.querySelector("#contact-email").value);
            const subject = contactForm.querySelector("#contact-subject").value;
            const message = contactForm.querySelector("#contact-message").value.trim();

            const messages = MV.readJSON("movieverse_messages", []);
            messages.push({
                name: name,
                email: email,
                subject: subject,
                message: message,
                date: new Date().toISOString()
            });
            MV.writeJSON("movieverse_messages", messages);

            contactForm.reset();
            V.clearFormErrors(contactForm);
            if (MV.sound) MV.sound.play("success");
            MV.showToast("Message sent to MovieVerse team!");
            setFormStatus(contactStatus, `Thank you, ${name}! Your message regarding "${subject}" has been received. We will respond to ${email} shortly.`, "success");
        });
    }
})();
