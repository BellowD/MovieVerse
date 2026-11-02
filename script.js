// Assignment 6 - jQuery
// Authors: Nurkhat Assan, Daurenbek Anuar

$(document).ready(function () {
    // TASK 0: JQUERY SETUP TEST
    // Verifies that jQuery is properly loaded and ready
    console.log("jQuery is ready!");

    // TASK 4: COLORFUL SCROLL PROGRESS BAR
    // Updates horizontal progress bar width as user scrolls down the page
    $(window).on("scroll", function () {
        var scrollTop = $(window).scrollTop();
        var docHeight = $(document).height() - $(window).height();
        var scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        $("#scroll-progress-bar").css("width", scrollPercent + "%");
    });

    // TASK 7: REUSABLE TOAST NOTIFICATION SYSTEM
    // Displays temporary toast notification that automatically fades out
    window.showToast = function (message) {
        var $toast = $('<div class="toast-message"></div>').text(message).hide();
        $("#toast-container").append($toast);
        $toast.fadeIn(250).delay(2200).fadeOut(400, function () {
            $(this).remove();
        });
    };

    // TASK 5: ANIMATED NUMBER COUNTER
    // Counts up statistics numbers smoothly using jQuery animate
    $(".counter-value").each(function () {
        var $this = $(this);
        var targetValue = parseInt($this.attr("data-target"), 10);
        var suffix = $this.attr("data-suffix") || "";

        $({ countNum: 0 }).animate({ countNum: targetValue }, {
            duration: 1600,
            easing: "swing",
            step: function () {
                $this.text(Math.floor(this.countNum) + suffix);
            },
            complete: function () {
                $this.text(targetValue + suffix);
            }
        });
    });

    // TASK 8: COPIED TO CLIPBOARD BUTTON
    // Copies snippet text to clipboard and shows checkmark and toast feedback
    $(".copy-btn").on("click", function () {
        var targetSelector = $(this).attr("data-copy-target");
        var textToCopy = $(targetSelector).text().trim();
        var $btn = $(this);
        var originalText = $btn.html();

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(function () {
                $btn.html("Copied!");
                $btn.addClass("copied");
                showToast("Copied to clipboard!");

                setTimeout(function () {
                    $btn.html(originalText);
                    $btn.removeClass("copied");
                }, 2000);
            });
        }
    });

    // TASK 6: LOADING SPINNER ON FORM SUBMIT
    // Shows spinner, disables button, and simulates server call before returning
    $("#contact-form").on("submit", function (e) {
        e.preventDefault();
        var $form = $(this);
        var $btn = $form.find('button[type="submit"]');

        if ($btn.hasClass("loading")) return;

        var originalHtml = $btn.html();
        $btn.addClass("loading").prop("disabled", true);
        $btn.html('<span class="spinner"></span> Please wait...');

        // Simulate asynchronous server call
        setTimeout(function () {
            $btn.removeClass("loading").prop("disabled", false);
            $btn.html(originalHtml);
            showToast("Profile settings updated successfully!");
            $("#profile-status").text("Profile updated successfully!").css("color", "#38bdf8");
        }, 1400);
    });

    // TASK 1, 2, 3: REAL-TIME SEARCH, AUTOCOMPLETE & HIGHLIGHTING
    var movieTitles = [
        "Mickey 17",
        "Avatar: Fire and Ash",
        "Superman",
        "Mission: Impossible",
        "Thunderbolts*",
        "The Gorge",
        "Jurassic World: Rebirth"
    ];

    var $searchInput = $("#movie-search-input");
    var $suggestionsBox = $("#search-suggestions");

    // Helper: Escapes special characters for regex search
    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // Task 3: Highlights matching keywords in search results and FAQ text
    function highlightSearchWords(query) {
        $(".searchable-text").each(function () {
            var $elem = $(this);
            var originalText = $elem.data("original-text");

            if (!originalText) {
                originalText = $elem.text();
                $elem.data("original-text", originalText);
            }

            if (query.trim().length > 0) {
                var regex = new RegExp("(" + escapeRegExp(query) + ")", "gi");
                var highlighted = originalText.replace(regex, '<span class="highlight">$1</span>');
                $elem.html(highlighted);
            } else {
                $elem.text(originalText);
            }
        });
    }

    if ($searchInput.length) {
        // Task 1: Real-time search and live filter on keyup/input
        $searchInput.on("keyup input", function () {
            var query = $(this).val().toLowerCase().trim();
            var matchesFound = 0;

            $(".search-movie-item").each(function () {
                var titleText = $(this).find(".movie-title").text().toLowerCase();
                var descText = $(this).find(".movie-desc").text().toLowerCase();

                if (titleText.indexOf(query) !== -1 || descText.indexOf(query) !== -1) {
                    $(this).stop(true, true).fadeIn(200);
                    matchesFound++;
                } else {
                    $(this).stop(true, true).fadeOut(200);
                }
            });

            // Update search results query and counter text
            $("#search-query-display").text('"' + $(this).val() + '"');
            $("#search-count-display").text("(Found " + matchesFound + " " + (matchesFound === 1 ? "match" : "matches") + ")");

            // Task 2: Autocomplete search suggestions dropdown
            $suggestionsBox.empty();
            if (query.length > 0) {
                var filteredTitles = movieTitles.filter(function (title) {
                    return title.toLowerCase().indexOf(query) !== -1;
                });

                if (filteredTitles.length > 0) {
                    filteredTitles.forEach(function (title) {
                        $suggestionsBox.append('<li class="suggestion-item">' + title + '</li>');
                    });
                    $suggestionsBox.slideDown(150);
                } else {
                    $suggestionsBox.hide();
                }
            } else {
                $suggestionsBox.hide();
            }

            // Task 3: Highlight matching keywords
            highlightSearchWords($(this).val());
        });

        // Click on an autocomplete suggestion item
        $(document).on("click", ".suggestion-item", function () {
            var selectedTitle = $(this).text();
            $searchInput.val(selectedTitle).trigger("input");
            $suggestionsBox.hide();
        });

        // Hide autocomplete dropdown when clicking outside
        $(document).on("click", function (e) {
            if (!$(e.target).closest(".search-wrapper").length) {
                $suggestionsBox.hide();
            }
        });
    }

    // TASK 9: IMAGE LAZY LOADING
    // Loads gallery images when they scroll into view using offset and attr
    function lazyLoadImages() {
        var windowBottom = $(window).scrollTop() + $(window).height();

        $(".lazy-load").each(function () {
            var $img = $(this);
            var dataSrc = $img.attr("data-src");

            if (dataSrc) {
                var imgTop = $img.offset().top;
                if (imgTop <= windowBottom + 120) {
                    $img.attr("src", dataSrc);
                    $img.removeAttr("data-src");
                    $img.addClass("loaded");
                }
            }
        });
    }

    $(window).on("scroll resize", lazyLoadImages);
    lazyLoadImages(); // Initial check for images in the first viewport fold
});
