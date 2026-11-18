// MovieVerse - Favorites & Ratings Management Module
// Handles local storage persistence, priority reordering, star ratings, and account sync.
// Authors: Nurkhat Assan, Daurenbek Anuar

window.MovieVerse = window.MovieVerse || {};

window.MovieVerse.favorites = (function () {
    const MV = window.MovieVerse;
    const CHANGE_EVENT = "movieverse:favorites-change";

    function getUserSuffix() {
        const user = MV.getCurrentUser ? MV.getCurrentUser() : null;
        return user ? "_" + user.id : "_guest";
    }

    function getFavKey() {
        return "movieverse_favorites" + getUserSuffix();
    }

    function getRatingsKey() {
        return "movieverse_ratings" + getUserSuffix();
    }

    function getAllFavorites() {
        return MV.readJSON(getFavKey(), []);
    }

    function saveFavorites(list) {
        MV.writeJSON(getFavKey(), list);
        notifyChange();
    }

    function getAllRatings() {
        return MV.readJSON(getRatingsKey(), []);
    }

    function saveRatings(list) {
        MV.writeJSON(getRatingsKey(), list);
        notifyChange();
    }

    function notifyChange() {
        document.dispatchEvent(new CustomEvent(CHANGE_EVENT));
        updateAllFavButtons();
    }

    function has(id) {
        if (!id) return false;
        return getAllFavorites().some(item => item.id === id);
    }

    function add(movie) {
        if (!movie || !movie.id) return false;
        const list = getAllFavorites();
        if (list.some(item => item.id === movie.id)) return false;

        list.unshift({
            id: movie.id,
            title: movie.title || "Untitled",
            year: movie.year || "",
            genre: movie.genre || "",
            poster: movie.poster || "",
            addedAt: new Date().toISOString()
        });

        saveFavorites(list);
        if (MV.sound) MV.sound.play("success");
        if (MV.showToast) MV.showToast(`Added "${movie.title}" to Favorites`);
        return true;
    }

    function remove(id) {
        const list = getAllFavorites();
        const movie = list.find(item => item.id === id);
        const filtered = list.filter(item => item.id !== id);

        if (filtered.length !== list.length) {
            saveFavorites(filtered);
            if (MV.sound) MV.sound.play("click");
            if (MV.showToast && movie) MV.showToast(`Removed "${movie.title}" from Favorites`);
            return true;
        }
        return false;
    }

    function toggle(movie) {
        if (has(movie.id)) {
            remove(movie.id);
            return false;
        } else {
            add(movie);
            return true;
        }
    }

    function moveUp(index) {
        const list = getAllFavorites();
        if (index <= 0 || index >= list.length) return;
        const temp = list[index];
        list[index] = list[index - 1];
        list[index - 1] = temp;
        saveFavorites(list);
    }

    function moveDown(index) {
        const list = getAllFavorites();
        if (index < 0 || index >= list.length - 1) return;
        const temp = list[index];
        list[index] = list[index + 1];
        list[index + 1] = temp;
        saveFavorites(list);
    }

    function rate(id, score, meta) {
        if (!id || score < 1 || score > 5) return;
        const ratings = getAllRatings();
        const existingIdx = ratings.findIndex(item => item.id === id);

        const record = {
            id: id,
            rating: score,
            title: meta && meta.title ? meta.title : "Unknown Movie",
            year: meta && meta.year ? meta.year : "",
            genre: meta && meta.genre ? meta.genre : "",
            ratedAt: new Date().toISOString()
        };

        if (existingIdx !== -1) {
            ratings[existingIdx] = record;
        } else {
            ratings.unshift(record);
        }

        saveRatings(ratings);
        if (MV.sound) MV.sound.play("success");
        if (MV.showToast) MV.showToast(`Rated ${record.title}: ${score} ★`);
    }

    function getRating(id) {
        const ratings = getAllRatings();
        const found = ratings.find(item => item.id === id);
        return found ? found.rating : 0;
    }

    // Merges guest favorites & ratings when logging in
    function mergeGuestData(userId) {
        if (!userId) return;
        const guestFavs = MV.readJSON("movieverse_favorites_guest", []);
        const userFavKey = "movieverse_favorites_" + userId;
        const userFavs = MV.readJSON(userFavKey, []);

        if (guestFavs.length > 0) {
            guestFavs.forEach(gItem => {
                if (!userFavs.some(uItem => uItem.id === gItem.id)) {
                    userFavs.push(gItem);
                }
            });
            MV.writeJSON(userFavKey, userFavs);
            MV.removeItem("movieverse_favorites_guest");
        }

        const guestRatings = MV.readJSON("movieverse_ratings_guest", []);
        const userRatKey = "movieverse_ratings_" + userId;
        const userRatings = MV.readJSON(userRatKey, []);

        if (guestRatings.length > 0) {
            guestRatings.forEach(gItem => {
                if (!userRatings.some(uItem => uItem.id === gItem.id)) {
                    userRatings.push(gItem);
                }
            });
            MV.writeJSON(userRatKey, userRatings);
            MV.removeItem("movieverse_ratings_guest");
        }

        notifyChange();
    }

    function updateAllFavButtons() {
        document.querySelectorAll(".fav-btn").forEach(btn => {
            const card = btn.closest(".movie-card");
            if (!card) return;
            const id = card.dataset.id || card.querySelector("h3")?.textContent?.trim();
            if (id && has(id)) {
                btn.classList.add("active");
                btn.setAttribute("aria-label", "Remove from favorites");
            } else {
                btn.classList.remove("active");
                btn.setAttribute("aria-label", "Add to favorites");
            }
        });
    }

    // Render Favorites Page if container exists
    function initFavoritesPage() {
        const container = document.getElementById("favorites-container");
        if (!container) return;

        const emptyState = document.getElementById("fav-empty-state");
        const counterBadge = document.getElementById("fav-counter-badge");
        const searchInput = document.getElementById("fav-search-input");
        const clearBtn = document.getElementById("clear-all-favs-btn");

        function render() {
            const list = getAllFavorites();
            const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
            const filtered = list.filter(item => {
                const title = (item.title || "").toLowerCase();
                const genre = (item.genre || "").toLowerCase();
                return title.includes(query) || genre.includes(query);
            });

            if (counterBadge) {
                counterBadge.textContent = `${list.length} Movie${list.length === 1 ? "" : "s"}`;
            }

            if (list.length === 0) {
                if (emptyState) emptyState.style.display = "block";
                container.innerHTML = "";
                if (clearBtn) clearBtn.style.display = "none";
                return;
            }

            if (emptyState) emptyState.style.display = "none";
            if (clearBtn) clearBtn.style.display = "inline-flex";

            if (filtered.length === 0) {
                container.innerHTML = `<div class="state-box" style="grid-column: 1 / -1;"><p>No saved movies match "${searchInput.value}".</p></div>`;
                return;
            }

            container.innerHTML = "";
            filtered.forEach((item, index) => {
                const card = document.createElement("div");
                card.className = "movie-card";
                card.dataset.id = item.id;

                const defaultPoster = "images/avatar.jpg";
                const poster = item.poster && item.poster !== "N/A" ? item.poster : defaultPoster;

                const posterWrap = document.createElement("div");
                posterWrap.className = "card-poster-wrap";
                const img = document.createElement("img");
                img.src = poster;
                img.alt = item.title;
                img.loading = "lazy";
                posterWrap.appendChild(img);

                const infoWrap = document.createElement("div");
                infoWrap.className = "movie-info";

                const textDiv = document.createElement("div");
                const h3 = document.createElement("h3");
                h3.textContent = item.title;
                const p = document.createElement("p");
                p.textContent = (item.genre || "Cinema") + (item.year ? " • " + item.year : "");
                textDiv.appendChild(h3);
                textDiv.appendChild(p);

                const actionsDiv = document.createElement("div");
                actionsDiv.style.marginTop = "10px";

                const moveRow = document.createElement("div");
                moveRow.style.display = "flex";
                moveRow.style.gap = "6px";
                moveRow.style.marginBottom = "10px";

                const upBtn = document.createElement("button");
                upBtn.type = "button";
                upBtn.className = "btn btn-secondary";
                upBtn.style.padding = "4px 8px";
                upBtn.style.fontSize = "0.8rem";
                upBtn.style.flexGrow = "1";
                upBtn.textContent = "▲ Up";
                if (index === 0) upBtn.disabled = true;
                upBtn.addEventListener("click", () => {
                    moveUp(index);
                    render();
                });

                const downBtn = document.createElement("button");
                downBtn.type = "button";
                downBtn.className = "btn btn-secondary";
                downBtn.style.padding = "4px 8px";
                downBtn.style.fontSize = "0.8rem";
                downBtn.style.flexGrow = "1";
                downBtn.textContent = "▼ Down";
                if (index === filtered.length - 1) downBtn.disabled = true;
                downBtn.addEventListener("click", () => {
                    moveDown(index);
                    render();
                });

                moveRow.appendChild(upBtn);
                moveRow.appendChild(downBtn);

                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "btn btn-danger";
                removeBtn.style.width = "100%";
                removeBtn.style.padding = "6px";
                removeBtn.style.fontSize = "0.85rem";
                removeBtn.textContent = "Remove";
                removeBtn.addEventListener("click", () => {
                    remove(item.id);
                    render();
                });

                actionsDiv.appendChild(moveRow);
                actionsDiv.appendChild(removeBtn);

                infoWrap.appendChild(textDiv);
                infoWrap.appendChild(actionsDiv);

                card.appendChild(posterWrap);
                card.appendChild(infoWrap);
                container.appendChild(card);
            });
        }

        if (searchInput) {
            searchInput.addEventListener("input", render);
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to clear your entire watchlist?")) {
                    saveFavorites([]);
                    MV.showToast("Watchlist cleared");
                    render();
                }
            });
        }

        document.addEventListener(CHANGE_EVENT, render);
        render();
    }

    // Attach click listeners to cards on page load
    document.addEventListener("DOMContentLoaded", function () {
        updateAllFavButtons();
        initFavoritesPage();

        document.addEventListener("click", function (e) {
            const btn = e.target.closest(".fav-btn");
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();

            const card = btn.closest(".movie-card");
            if (!card) return;

            const title = card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "Movie";
            const id = card.dataset.id || title;
            const genre = card.dataset.genre || (card.querySelector(".movie-info p") ? card.querySelector(".movie-info p").textContent.trim() : "");
            const poster = card.querySelector("img") ? card.querySelector("img").getAttribute("src") : "";
            const year = card.dataset.year || "";

            toggle({ id, title, genre, poster, year });
        });
    });

    return {
        CHANGE_EVENT: CHANGE_EVENT,
        getAll: getAllFavorites,
        has: has,
        add: add,
        remove: remove,
        toggle: toggle,
        moveUp: moveUp,
        moveDown: moveDown,
        rate: rate,
        getRating: getRating,
        getRatings: getAllRatings,
        mergeGuestData: mergeGuestData,
        updateAllFavButtons: updateAllFavButtons
    };
})();
