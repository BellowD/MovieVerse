// Assignment 5 - Advanced JavaScript and DOM Manipulation
// Authors: Nurkhat Assan, Daurenbek Anuar

document.addEventListener("DOMContentLoaded", function () {
    const body = document.body;

    // SHARED STYLES
    const style = document.createElement("style");
    style.textContent = `
        #navbar-datetime {
            flex-shrink: 0;
            margin-right: 12px;
            font-size: 12px;
            white-space: nowrap;
            color: inherit;
        }

        .faq-answer {
            overflow: hidden !important;
            max-height: 0;
            padding: 0 15px !important;
            opacity: 0;
            transition: max-height .35s ease,
                        padding .35s ease,
                        opacity .35s ease;
        }

        .faq-answer.open {
            opacity: 1;
            padding: 15px !important;
        }

        .fav-btn,
        .fav-btn-active {
            transition: color .2s ease, text-shadow .2s ease, transform .2s ease;
        }

        .fav-btn:hover,
        .fav-btn-active:hover {
            color: #facc15 !important;
            text-shadow: 0 0 10px rgba(250,204,21,.8) !important;
        }

        .remove-hover {
            background-color: #dc2626 !important;
            color: #ffffff !important;
        }

        @media (prefers-reduced-motion: reduce) {
            .faq-answer {
                transition: none !important;
            }
        }
    `;
    document.head.appendChild(style);

    // SOUND EFFECTS
    // Plays a short notification chime on user interactions
    const notificationAudio = new Audio("sounds/notification.wav");

    function playSound() {
        try {
            notificationAudio.currentTime = 0;
            notificationAudio.play().catch(function () {
                // Safely handle browser autoplay policy restrictions
            });
        } catch (e) {}
    }

    // NAVBAR CLOCK
    // Displays formatted live time in the navigation menu
    const navbar = document.querySelector(".nav-menu");
    const logo = navbar ? navbar.querySelector(".logo") : null;
    let clock = document.getElementById("navbar-datetime");

    if (navbar && logo) {
        if (!clock) {
            clock = document.createElement("span");
            clock.id = "navbar-datetime";
        }
        navbar.insertBefore(clock, logo);
    }

    function updateClock() {
        if (!clock) return;

        clock.textContent = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(new Date());
    }

    updateClock();
    if (clock) {
        setInterval(updateClock, 1000);
    }

    // KEYBOARD NAVIGATION
    // Enables arrow key navigation across navigation menu links using switch
    const navLinks = Array.from(document.querySelectorAll(".nav-links a"));

    navLinks.forEach(function (link, index) {
        link.addEventListener("keydown", function (event) {
            let targetIndex = null;

            switch (event.key) {
                case "ArrowRight":
                case "ArrowDown":
                    event.preventDefault();
                    targetIndex = (index + 1) % navLinks.length;
                    break;
                case "ArrowLeft":
                case "ArrowUp":
                    event.preventDefault();
                    targetIndex = (index - 1 + navLinks.length) % navLinks.length;
                    break;
            }

            if (targetIndex !== null) {
                navLinks[targetIndex].focus();
            }
        });
    });

    // Allows arrow keys to enter menu navigation when focus is on the page
    document.addEventListener("keydown", function (event) {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
        if (activeTag === "input" || activeTag === "textarea") return;

        if (!navLinks.includes(document.activeElement)) {
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                if (navLinks.length > 0) {
                    event.preventDefault();
                    navLinks[0].focus();
                }
            } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                if (navLinks.length > 0) {
                    event.preventDefault();
                    navLinks[navLinks.length - 1].focus();
                }
            }
        }
    });

    // POPUP MODAL
    // Controls opening and closing the subscription popup dialog
    const popup = document.getElementById("subscription-popup");
    const openButton = document.getElementById("open-subscription");
    const closeButton = document.getElementById("close-subscription");

    function stylePopup() {
        if (!popup) return;

        const modal = popup.querySelector('[role="dialog"]');
        if (modal) {
            Object.assign(modal.style, {
                width: "100%",
                maxWidth: "440px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxSizing: "border-box",
                padding: "28px",
                border: "1px solid #3b4252",
                borderRadius: "12px",
                backgroundColor: "#2e3440",
                color: "#eceff4"
            });
        }

        popup.querySelectorAll("input").forEach(function (input) {
            Object.assign(input.style, {
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 12px",
                marginTop: "6px",
                border: "1px solid #3b4252",
                borderRadius: "6px",
                backgroundColor: "#242933",
                color: "#eceff4",
                fontFamily: "inherit",
                fontSize: "16px"
            });
        });

        popup.querySelectorAll("label").forEach(function (label) {
            label.style.display = "block";
            label.style.marginTop = "14px";
            label.style.marginBottom = "6px";
            label.style.color = "#d8dee9";
        });

        popup.querySelectorAll("h2, p").forEach(function (element) {
            if (element.id === "form-message") return;
            element.style.color = "#d8dee9";
        });
    }

    if (popup) {
        Object.assign(popup.style, {
            display: "none",
            position: "fixed",
            inset: "0",
            zIndex: "1000",
            padding: "16px",
            backgroundColor: "rgba(0,0,0,.78)",
            justifyContent: "center",
            alignItems: "center",
            overflowY: "auto",
            boxSizing: "border-box"
        });

        stylePopup();
    }

    function openPopup() {
        if (!popup) return;

        stylePopup();
        popup.style.display = "flex";
        popup.setAttribute("aria-hidden", "false");
        playSound();
    }

    function closePopup() {
        if (!popup) return;

        popup.style.display = "none";
        popup.setAttribute("aria-hidden", "true");
    }

    if (openButton) {
        openButton.addEventListener("click", openPopup);
    }

    if (closeButton) {
        closeButton.addEventListener("click", closePopup);
    }

    if (popup) {
        popup.addEventListener("click", function (event) {
            if (event.target === popup) {
                closePopup();
            }
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closePopup();
        }
    });

    // FORM VALIDATION
    // Validates email and passwords for the subscription modal
    const form = document.getElementById("subscription-form");
    const message = document.getElementById("form-message");

    if (form && message) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("subscription-email");
            const password = document.getElementById("subscription-password");
            const confirmation = document.getElementById("confirm-password");

            message.textContent = "";

            if (!email || !email.value.trim() || !email.checkValidity()) {
                message.textContent = "Please enter a valid email address.";
                message.style.color = "#ef4444";
                if (email) email.focus();
                return;
            }

            if (!password || password.value.length < 8) {
                message.textContent = "Password must contain at least 8 characters.";
                message.style.color = "#ef4444";
                if (password) password.focus();
                return;
            }

            if (!confirmation || password.value !== confirmation.value) {
                message.textContent = "Passwords do not match.";
                message.style.color = "#ef4444";
                if (confirmation) confirmation.focus();
                return;
            }

            playSound();
            message.textContent = "Your information is valid!";
            message.style.color = "#16a34a";
            form.reset();
        });
    }

    // FAQ ACCORDION
    // Toggles FAQ question accordion panels
    document.querySelectorAll(".faq-question").forEach(function (button) {
        const answer = button.nextElementSibling;
        if (!answer) return;

        button.setAttribute("aria-expanded", "false");
        answer.setAttribute("aria-hidden", "true");
        answer.classList.remove("open");

        answer.style.setProperty("max-height", "0", "important");
        answer.style.setProperty("padding", "0 15px", "important");
        answer.style.setProperty("opacity", "0", "important");

        button.addEventListener("click", function () {
            const isOpen = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", String(!isOpen));
            answer.setAttribute("aria-hidden", String(isOpen));

            if (isOpen) {
                answer.classList.remove("open");
                answer.style.setProperty("max-height", "0", "important");
                answer.style.setProperty("padding", "0 15px", "important");
                answer.style.setProperty("opacity", "0", "important");
            } else {
                answer.classList.add("open");
                answer.style.setProperty("max-height", answer.scrollHeight + 40 + "px", "important");
                answer.style.setProperty("padding", "15px", "important");
                answer.style.setProperty("opacity", "1", "important");
                playSound();
            }

            const icon = button.querySelector(".faq-icon");
            if (icon) {
                icon.textContent = isOpen ? "+" : "−";
            }
        });
    });

    // LIGHT AND DARK THEME TOGGLE
    // Toggles between Light and Dark themes using classes and styles
    const themeButton = document.getElementById("change-background");

    if (themeButton) {
        // Set initial button label
        themeButton.textContent = body.classList.contains("light-theme") ? "Dark Theme" : "Light Theme";

        themeButton.addEventListener("click", function () {
            const isLight = body.classList.toggle("light-theme");
            themeButton.textContent = isLight ? "Dark Theme" : "Light Theme";
            playSound();
        });
    }

    // READ MORE TOGGLE
    // Toggles extra description visibility on the movie page
    const readMoreBtn = document.getElementById("read-more-btn");
    const moreText = document.getElementById("more-text");

    if (readMoreBtn && moreText) {
        readMoreBtn.addEventListener("click", function () {
            const isHidden = moreText.style.display === "none" || !moreText.style.display;

            if (isHidden) {
                moreText.style.display = "inline";
                readMoreBtn.textContent = "Read Less";
            } else {
                moreText.style.display = "none";
                readMoreBtn.textContent = "Read More";
            }
        });
    }

    // STAR RATING SYSTEM
    // Enables clicking stars to set a movie rating with color update and animation
    const starItems = document.querySelectorAll("#movie-stars .star-rating-item");
    const ratingFeedback = document.getElementById("rating-score-text");

    starItems.forEach(function (star) {
        star.addEventListener("click", function () {
            const selectedRating = parseInt(star.getAttribute("data-rating"), 10);

            // Update star appearance based on rating
            starItems.forEach(function (item) {
                const itemRating = parseInt(item.getAttribute("data-rating"), 10);
                if (itemRating <= selectedRating) {
                    item.classList.add("selected");
                } else {
                    item.classList.remove("selected");
                }
            });

            // Trigger click animation on the selected star
            star.style.transform = "scale(1.35)";
            setTimeout(function () {
                star.style.transform = "scale(1)";
            }, 200);

            // Update rating text and play feedback sound
            if (ratingFeedback) {
                ratingFeedback.textContent = "You rated: " + selectedRating + " / 5 stars";
                ratingFeedback.style.color = "#38bdf8";
            }

            playSound();
        });
    });

    // TIME-BASED GREETING
    // Displays personalized greeting using a switch statement based on the hour
    const greetingText = document.getElementById("time-greeting");

    if (greetingText) {
        const hour = new Date().getHours();
        let greeting = "Welcome";

        switch (true) {
            case hour >= 5 && hour < 12:
                greeting = "Good morning, Movie Lover!";
                break;
            case hour >= 12 && hour < 18:
                greeting = "Good afternoon, Movie Lover!";
                break;
            case hour >= 18 && hour < 23:
                greeting = "Good evening, Movie Lover!";
                break;
            default:
                greeting = "Good night, Movie Lover!";
                break;
        }

        greetingText.textContent = greeting;
    }

    // MOVIE GENRE FILTER
    // Filters movie cards using a switch statement and higher-order functions
    const filterButtons = document.querySelectorAll(".filter-btn");
    const movieCards = document.querySelectorAll(".card-row .movie-card");

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const selectedGenre = button.getAttribute("data-genre");

            // Update active button state
            filterButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });
            button.classList.add("active");

            // Filter movies using a switch statement
            movieCards.forEach(function (card) {
                const cardGenre = card.getAttribute("data-genre");
                let shouldShow = true;

                switch (selectedGenre) {
                    case "scifi":
                        shouldShow = cardGenre === "scifi";
                        break;
                    case "action":
                        shouldShow = cardGenre === "action";
                        break;
                    case "all":
                    default:
                        shouldShow = true;
                        break;
                }

                if (shouldShow) {
                    card.style.display = "flex";
                    card.style.opacity = "0";
                    card.style.transform = "scale(0.96)";
                    setTimeout(function () {
                        card.style.transition = "opacity .25s ease, transform .25s ease";
                        card.style.opacity = "1";
                        card.style.transform = "scale(1)";
                    }, 20);
                } else {
                    card.style.display = "none";
                }
            });

            playSound();
        });
    });

    // MOVIE QUOTES OBJECT
    // Stores quotes data and methods using JavaScript objects, arrays, and loops
    const quoteManager = {
        quotes: [
            { text: "I see you.", movie: "Avatar: Fire and Ash" },
            { text: "There is a right and a wrong in the universe.", movie: "Superman" },
            { text: "I am Mickey Barnes, and I keep dying.", movie: "Mickey 17" },
            { text: "We live and die in the shadows for those we hold dear.", movie: "Mission: Impossible" },
            { text: "There are bad guys, and there are worse guys.", movie: "Thunderbolts*" },
            { text: "Hold your breath and don't look down.", movie: "The Gorge" }
        ],
        lastIndex: 0,
        getNextQuote: function () {
            let nextIndex = this.lastIndex;

            // Loop until we find a different quote
            while (this.quotes.length > 1 && nextIndex === this.lastIndex) {
                nextIndex = Math.floor(Math.random() * this.quotes.length);
            }

            this.lastIndex = nextIndex;
            return this.quotes[nextIndex];
        }
    };

    const newQuoteBtn = document.getElementById("new-quote-btn");
    const quoteDisplay = document.getElementById("quote-display");

    if (newQuoteBtn && quoteDisplay) {
        newQuoteBtn.addEventListener("click", function () {
            const quote = quoteManager.getNextQuote();

            // Animate quote transition
            quoteDisplay.style.opacity = "0";
            setTimeout(function () {
                quoteDisplay.innerHTML = `<p>"${quote.text}" — <strong style="color: #38bdf8;">${quote.movie}</strong></p>`;
                quoteDisplay.style.opacity = "1";
            }, 200);

            playSound();
        });
    }

    // FORM RESET
    // Clears all form fields using querySelectorAll and forEach
    const resetProfileBtn = document.getElementById("reset-profile-btn");
    const profileForm = document.getElementById("contact-form");
    const profileStatus = document.getElementById("profile-status");

    if (resetProfileBtn && profileForm) {
        resetProfileBtn.addEventListener("click", function () {
            const inputs = profileForm.querySelectorAll("input, textarea");

            // Clear all input elements
            inputs.forEach(function (input) {
                input.value = "";
            });

            if (profileStatus) {
                profileStatus.textContent = "All form fields have been reset.";
                profileStatus.style.color = "#94a3b8";
            }

            playSound();
        });
    }

    // ASYNCHRONOUS FORM SUBMISSION WITH CALLBACK
    // Processes form submission and invokes a callback to display response
    function submitProfileForm(data, callback) {
        // Simulating asynchronous operation
        setTimeout(function () {
            callback("Profile for @" + data.username + " was updated successfully!");
        }, 300);
    }

    if (profileForm) {
        profileForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const usernameField = document.getElementById("username");
            const usernameValue = usernameField && usernameField.value ? usernameField.value.trim() : "User";

            submitProfileForm({ username: usernameValue }, function (successMessage) {
                if (profileStatus) {
                    profileStatus.textContent = successMessage;
                    profileStatus.style.color = "#38bdf8";
                }
                playSound();
            });
        });
    }

    // WATCH NOW BUTTON
    // Triggers notification sound and feedback message
    const watchNowBtn = document.getElementById("watch-now-btn");
    const watchFeedback = document.getElementById("watch-feedback");

    if (watchNowBtn) {
        watchNowBtn.addEventListener("click", function () {
            playSound();
            if (watchFeedback) {
                watchFeedback.style.display = "inline";
                watchFeedback.style.opacity = "0";
                setTimeout(function () {
                    watchFeedback.style.transition = "opacity .3s ease";
                    watchFeedback.style.opacity = "1";
                }, 10);
            }
        });
    }

    // FAVORITE STARS
    // Handles hover and click toggling for favorite star buttons
    document.querySelectorAll(".fav-btn, .fav-btn-active").forEach(function (star) {
        star.addEventListener("mouseenter", function () {
            star.style.setProperty("color", "#facc15", "important");
            star.style.textShadow = "0 0 10px rgba(250,204,21,.8)";
        });

        star.addEventListener("mouseleave", function () {
            star.style.textShadow = "";
            if (star.classList.contains("fav-btn-active")) {
                star.style.setProperty("color", "#facc15", "important");
            } else {
                star.style.removeProperty("color");
            }
        });

        star.addEventListener("click", function () {
            const isNowActive = star.classList.toggle("fav-btn-active");
            star.classList.toggle("fav-btn", !isNowActive);

            // Bounce animation on click
            star.style.transform = "scale(1.3)";
            setTimeout(function () {
                star.style.transform = "scale(1)";
            }, 180);

            playSound();
        });
    });

    // REMOVE BUTTONS
    // Removes favorite card with smooth transition and updates counter
    const removeButtons = document.querySelectorAll(".remove-fav-btn, button, a");
    const favCountSpan = document.getElementById("fav-count");

    removeButtons.forEach(function (button) {
        if (button.textContent.trim().toLowerCase() !== "remove") {
            return;
        }

        button.addEventListener("mouseenter", function () {
            button.classList.add("remove-hover");
        });

        button.addEventListener("mouseleave", function () {
            button.classList.remove("remove-hover");
        });

        button.addEventListener("click", function () {
            const card = button.closest(".movie-card");
            if (!card) return;

            // Smooth exit animation
            card.style.transition = "opacity .3s ease, transform .3s ease";
            card.style.opacity = "0";
            card.style.transform = "scale(0.85)";

            playSound();

            setTimeout(function () {
                card.remove();

                // Update remaining favorites count
                if (favCountSpan) {
                    const remainingCards = document.querySelectorAll("#favorites-container .movie-card");
                    favCountSpan.textContent = remainingCards.length;
                }
            }, 300);
        });
    });
});
