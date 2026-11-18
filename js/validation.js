// MovieVerse - Comprehensive Client-Side Form Validation Module
// Strict compliance: Zero HTML5 validation attributes used, all forms use novalidate.
// Errors are rendered dynamically into the DOM under each input with ARIA attributes.
// Authors: Nurkhat Assan, Daurenbek Anuar

window.MovieVerse = window.MovieVerse || {};

window.MovieVerse.validation = (function () {
    // RFC 5322 compliant email regex
    const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    // Kazakhstan / International mobile phone regex: +7 / 8 with 10 digits
    // Supports formats: +7 701 123 45 67, 8 777 987 65 43, +77051112233
    const PHONE_REGEX = /^(\+7|8)7\d{9}$/;

    // Name regex: Letters (Latin, Cyrillic), spaces, hyphens, min 2 chars
    const NAME_REGEX = /^[\p{L}\s'-]{2,50}$/u;

    function toText(val) {
        return val === undefined || val === null ? "" : String(val);
    }

    function isFilled(val) {
        return toText(val).trim().length > 0;
    }

    function minLength(val, n) {
        return toText(val).trim().length >= n;
    }

    function maxLength(val, n) {
        return toText(val).trim().length <= n;
    }

    function isValidEmail(val) {
        return EMAIL_REGEX.test(toText(val).trim());
    }

    function normalizePhone(val) {
        return toText(val).replace(/[\s\-\(\)]/g, "");
    }

    function isValidPhone(val) {
        return PHONE_REGEX.test(normalizePhone(val));
    }

    function isValidName(val) {
        return NAME_REGEX.test(toText(val).trim());
    }

    // Password complexity check
    function getPasswordProblem(val) {
        const pass = toText(val);
        if (pass.length < 8) return "Password must be at least 8 characters long";
        if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter (A-Z)";
        if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter (a-z)";
        if (!/\d/.test(pass)) return "Password must contain at least one digit (0-9)";
        if (!/[^A-Za-z0-9\s]/.test(pass)) return "Password must contain at least one special character (!@#$%^&*)";
        return "";
    }

    function isStrongPassword(val) {
        return getPasswordProblem(val) === "";
    }

    function passwordsMatch(pass1, pass2) {
        return toText(pass1) === toText(pass2) && isFilled(pass1);
    }

    // DOM Error display functions
    function getErrorElementId(input) {
        return (input.id || input.name || "input") + "-error";
    }

    function showFieldError(input, message) {
        const errorId = getErrorElementId(input);
        let errorEl = document.getElementById(errorId);

        if (!errorEl) {
            errorEl = document.createElement("p");
            errorEl.id = errorId;
            errorEl.className = "field-error";
            const container = input.closest(".form-group, .search-wrapper") || input.parentElement;
            container.appendChild(errorEl);
        }

        errorEl.textContent = message;
        input.setAttribute("aria-invalid", "true");

        const existingDescribedBy = (input.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
        if (!existingDescribedBy.includes(errorId)) {
            existingDescribedBy.push(errorId);
            input.setAttribute("aria-describedby", existingDescribedBy.join(" "));
        }
    }

    function clearFieldError(input) {
        const errorId = getErrorElementId(input);
        const errorEl = document.getElementById(errorId);
        if (errorEl) {
            errorEl.remove();
        }

        input.removeAttribute("aria-invalid");

        const describedBy = (input.getAttribute("aria-describedby") || "").split(" ")
            .filter(id => id && id !== errorId);

        if (describedBy.length > 0) {
            input.setAttribute("aria-describedby", describedBy.join(" "));
        } else {
            input.removeAttribute("aria-describedby");
        }
    }

    function clearFormErrors(form) {
        form.querySelectorAll("[aria-invalid='true']").forEach(clearFieldError);
        delete form.dataset.submitted;
    }

    // Rule definitions
    const rules = {
        required: function (fieldName) {
            return function (value) {
                return isFilled(value) ? "" : fieldName + " is required";
            };
        },
        name: function (fieldName) {
            return function (value) {
                if (!isFilled(value)) return fieldName + " is required";
                if (!minLength(value, 2)) return fieldName + " must be at least 2 characters";
                return isValidName(value) ? "" : fieldName + " can only contain letters, spaces and hyphens";
            };
        },
        email: function () {
            return function (value) {
                if (!isFilled(value)) return "Email is required";
                return isValidEmail(value) ? "" : "Please enter a valid email address (e.g. name@example.com)";
            };
        },
        phone: function () {
            return function (value) {
                if (!isFilled(value)) return "Phone number is required";
                return isValidPhone(value) ? "" : "Enter a valid phone number: +7 7XX XXX XX XX or 8 7XX XXX XX XX";
            };
        },
        strongPassword: function () {
            return function (value) {
                if (!isFilled(value)) return "Password is required";
                return getPasswordProblem(value);
            };
        },
        length: function (fieldName, min, max) {
            return function (value) {
                if (min && !minLength(value, min)) return fieldName + " must be at least " + min + " characters";
                if (max && !maxLength(value, max)) return fieldName + " must not exceed " + max + " characters";
                return "";
            };
        }
    };

    function combine() {
        const checkFns = Array.from(arguments);
        return function (value, form) {
            for (let i = 0; i < checkFns.length; i++) {
                const err = checkFns[i](value, form);
                if (err) return err;
            }
            return "";
        };
    }

    // Validate complete form
    function validateForm(form, fieldRules) {
        let firstInvalidInput = null;

        Object.keys(fieldRules).forEach(function (id) {
            const input = form.querySelector("#" + id);
            if (!input) return;

            const err = fieldRules[id](input.value, form);
            if (err) {
                showFieldError(input, err);
                if (!firstInvalidInput) firstInvalidInput = input;
            } else {
                clearFieldError(input);
            }
        });

        form.dataset.submitted = "true";

        if (firstInvalidInput) {
            if (window.MovieVerse.sound) window.MovieVerse.sound.play("error");
            firstInvalidInput.focus();
            return false;
        }
        return true;
    }

    // Live validation attachment
    function attachLiveValidation(form, fieldRules) {
        Object.keys(fieldRules).forEach(function (id) {
            const input = form.querySelector("#" + id);
            if (!input) return;

            input.addEventListener("blur", function () {
                if (!isFilled(input.value) && form.dataset.submitted !== "true") return;
                const err = fieldRules[id](input.value, form);
                if (err) {
                    showFieldError(input, err);
                } else {
                    clearFieldError(input);
                }
            });

            const recheck = function () {
                if (input.getAttribute("aria-invalid") !== "true") return;
                const err = fieldRules[id](input.value, form);
                if (err) {
                    showFieldError(input, err);
                } else {
                    clearFieldError(input);
                }
            };

            input.addEventListener("input", recheck);
            input.addEventListener("change", recheck);
        });
    }

    // Dynamic character counter
    function attachCounter(textarea, counterEl, max) {
        if (!textarea || !counterEl) return function () {};

        const update = function () {
            const length = textarea.value.trim().length;
            counterEl.textContent = length + " / " + max;
            counterEl.classList.toggle("is-over-limit", length > max);
        };

        textarea.addEventListener("input", update);
        update();
        return update;
    }

    return {
        isFilled: isFilled,
        minLength: minLength,
        maxLength: maxLength,
        isValidEmail: isValidEmail,
        isValidPhone: isValidPhone,
        isValidName: isValidName,
        normalizePhone: normalizePhone,
        isStrongPassword: isStrongPassword,
        getPasswordProblem: getPasswordProblem,
        passwordsMatch: passwordsMatch,
        showFieldError: showFieldError,
        clearFieldError: clearFieldError,
        clearFormErrors: clearFormErrors,
        rules: rules,
        combine: combine,
        validateForm: validateForm,
        attachLiveValidation: attachLiveValidation,
        attachCounter: attachCounter
    };
})();
