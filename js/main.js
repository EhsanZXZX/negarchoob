/* ==========================================================================
   نگار چوب پارمیس — interaction layer
   No dependencies. Every behaviour degrades gracefully without JS.
   ========================================================================== */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----------------------------------------------------------------------
       Nav — solid background once scrolled past the hero threshold
       ---------------------------------------------------------------------- */
    var nav = document.querySelector('.nav');
    if (nav) {
        var syncNav = function () {
            nav.classList.toggle('is-scrolled', window.scrollY > 32);
        };
        syncNav();
        window.addEventListener('scroll', syncNav, { passive: true });
    }

    /* ----------------------------------------------------------------------
       Mobile drawer — Esc to close, focus returned to the trigger
       ---------------------------------------------------------------------- */
    var toggle = document.querySelector('.nav-toggle');
    var drawer = document.querySelector('.mobile-drawer');
    var drawerClose = document.querySelector('.mobile-drawer-close');

    if (toggle && drawer) {
        var openDrawer = function () {
            drawer.classList.add('is-open');
            toggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            if (drawerClose) drawerClose.focus();
        };
        var closeDrawer = function () {
            drawer.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };

        toggle.addEventListener('click', openDrawer);
        if (drawerClose) {
            drawerClose.addEventListener('click', function () {
                closeDrawer();
                toggle.focus();
            });
        }
        drawer.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeDrawer);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
                closeDrawer();
                toggle.focus();
            }
        });
    }

    /* ----------------------------------------------------------------------
       Scroll reveal — Standard tier: ~900ms, 20px rise, 80ms stagger.
       Elements are made visible immediately if IO is unavailable, so content
       is never permanently hidden.
       ---------------------------------------------------------------------- */
    document.querySelectorAll('.reveal-group').forEach(function (group) {
        Array.prototype.forEach.call(group.children, function (child, i) {
            child.style.setProperty('--i', i);
        });
    });

    var revealEls = document.querySelectorAll('.reveal, .rise');

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
        var revealIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealIO.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

        revealEls.forEach(function (el) { revealIO.observe(el); });
    }

    /* ----------------------------------------------------------------------
       Hero video
       · Manual pause control (WCAG 2.2.2 — motion longer than 5s)
       · Auto-pauses off-screen so it stops burning battery and bandwidth
       · Never auto-plays under prefers-reduced-motion
       ---------------------------------------------------------------------- */
    var heroVideo = document.querySelector('[data-hero-video]');
    var mediaToggle = document.querySelector('.media-toggle');

    if (heroVideo) {
        var userPaused = reduceMotion;

        if (reduceMotion) {
            heroVideo.removeAttribute('autoplay');
            heroVideo.pause();
            if (mediaToggle) mediaToggle.setAttribute('aria-pressed', 'true');
        }

        if (mediaToggle) {
            mediaToggle.addEventListener('click', function () {
                userPaused = !heroVideo.paused;
                if (userPaused) {
                    heroVideo.pause();
                } else {
                    var p = heroVideo.play();
                    if (p && p.catch) p.catch(function () {});
                }
                mediaToggle.setAttribute('aria-pressed', String(userPaused));
            });
        }

        if ('IntersectionObserver' in window) {
            var heroIO = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        if (!userPaused) {
                            var p = heroVideo.play();
                            if (p && p.catch) p.catch(function () {});
                        }
                    } else {
                        heroVideo.pause();
                    }
                });
            }, { threshold: 0.15 });
            heroIO.observe(heroVideo);
        }
    }

    /* ----------------------------------------------------------------------
       Showreel — click to play. Deliberately not auto-playing: one autoplay
       video per page is the budget, and the hero already spends it.
       ---------------------------------------------------------------------- */
    document.querySelectorAll('[data-showreel]').forEach(function (reel) {
        var video = reel.querySelector('video');
        var trigger = reel.querySelector('.play-btn');
        if (!video || !trigger) return;

        trigger.addEventListener('click', function () {
            reel.classList.add('is-playing');
            video.setAttribute('controls', '');
            video.muted = false;
            var p = video.play();
            if (p && p.catch) {
                p.catch(function () {
                    // Autoplay-with-sound refused: fall back to muted playback.
                    video.muted = true;
                    video.play().catch(function () {});
                });
            }
            video.focus();
        });

        video.addEventListener('pause', function () {
            if (video.currentTime === 0) reel.classList.remove('is-playing');
        });
    });

    /* ----------------------------------------------------------------------
       Contact form
       · Validates on blur (not submit-only)
       · Errors sit next to their field, announced via aria-live
       · Composes a mailto: draft — this is a static site with no backend,
         so the submit hands off to the visitor's mail client rather than
         silently doing nothing.
       ---------------------------------------------------------------------- */
    var form = document.querySelector('[data-contact-form]');
    if (form) {
        var status = form.querySelector('.form-status');

        var validateField = function (input) {
            var wrap = input.closest('.field');
            if (!wrap) return true;
            var ok = input.checkValidity() && input.value.trim() !== '';
            wrap.classList.toggle('has-error', !ok);
            input.setAttribute('aria-invalid', ok ? 'false' : 'true');
            return ok;
        };

        form.querySelectorAll('input, textarea').forEach(function (input) {
            input.addEventListener('blur', function () {
                if (input.required || input.value.trim() !== '') validateField(input);
            });
            input.addEventListener('input', function () {
                var wrap = input.closest('.field');
                if (wrap && wrap.classList.contains('has-error')) validateField(input);
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var required = form.querySelectorAll('[required]');
            var firstInvalid = null;
            required.forEach(function (input) {
                if (!validateField(input) && !firstInvalid) firstInvalid = input;
            });

            if (firstInvalid) {
                firstInvalid.focus();
                if (status) {
                    status.textContent = 'لطفاً فیلدهای الزامی را کامل کنید.';
                    status.classList.add('is-shown');
                }
                return;
            }

            var get = function (name) {
                var el = form.elements[name];
                return el ? el.value.trim() : '';
            };

            var subject = get('subject') || 'درخواست مشاوره پروژه';
            var body = [
                'نام: ' + get('name'),
                'شماره تماس: ' + get('phone'),
                '',
                get('message')
            ].join('\n');

            if (status) {
                status.textContent = 'در حال باز کردن برنامه ایمیل شما… اگر باز نشد، مستقیماً به negarchoubparmis@gmail.com بنویسید یا تماس بگیرید.';
                status.classList.add('is-shown');
            }

            window.location.href = 'mailto:negarchoubparmis@gmail.com'
                + '?subject=' + encodeURIComponent(subject)
                + '&body=' + encodeURIComponent(body);
        });
    }

    /* ----------------------------------------------------------------------
       Current year in the footer
       ---------------------------------------------------------------------- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
        var jalali = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());
        el.textContent = jalali;
    });
})();

/* ==========================================================================
   WhatsApp card — first visit of a session only.
   Independent module: adds nothing to, and reads nothing from, the block above.
   ========================================================================== */
(function () {
    'use strict';

    var KEY = 'ncp-wa-dismissed';
    var pop = document.getElementById('waPop');
    if (!pop) return;

    // Already dismissed in this session — never rendered again.
    try {
        if (window.sessionStorage && sessionStorage.getItem(KEY) === '1') return;
    } catch (e) {
        // Private mode / storage blocked: fall through and show it once.
    }

    var closeBtn = pop.querySelector('.wa-pop-close');
    var cta = pop.querySelector('.btn');
    var opened = false;

    var dismiss = function (returnFocus) {
        pop.classList.remove('is-open');
        try { if (window.sessionStorage) sessionStorage.setItem(KEY, '1'); } catch (e) {}
        window.setTimeout(function () { pop.hidden = true; }, 600);
        document.removeEventListener('keydown', onKey);
        if (returnFocus && document.activeElement === closeBtn) {
            try { document.activeElement.blur(); } catch (e) {}
        }
    };

    function onKey(e) {
        if (e.key === 'Escape') dismiss(true);
    }

    var open = function () {
        if (opened) return;
        opened = true;
        pop.hidden = false;
        // Next frame, so the transition runs from the hidden state.
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () { pop.classList.add('is-open'); });
        });
        document.addEventListener('keydown', onKey);
    };

    if (closeBtn) closeBtn.addEventListener('click', function () { dismiss(true); });
    // Taking up the offer counts as handled — don't nag on the next page.
    if (cta) cta.addEventListener('click', function () { dismiss(false); });

    // Late enough not to collide with the hero landing, early enough to be seen.
    window.setTimeout(open, 2600);
})();
