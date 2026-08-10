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

/* ==========================================================================
   ROYAL PALACE case page — hero film, frame reveal, parallax, lightbox.
   Self-contained: bails out immediately on every other page.
   ========================================================================== */
(function () {
    'use strict';

    if (!document.body.hasAttribute('data-rp')) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO  = 'IntersectionObserver' in window;
    var coarse = window.matchMedia('(max-width: 700px)').matches;

    /* ----------------------------------------------------------------------
       Hero — type lands on load; the film only rolls where it is welcome.
       On narrow screens the poster stands in, so a visitor on mobile data
       never pays for a background video they did not ask for.
       ---------------------------------------------------------------------- */
    // The partnerships hero shares the entrance choreography but carries a
    // still, not a film — the video branch below simply finds nothing.
    var hero = document.querySelector('[data-rp-hero], [data-ip-hero]');
    var heroVid = document.querySelector('[data-rp-hero-video]');
    var heroPause = document.querySelector('.rp-hero-pause');

    if (hero) {
        var startHero = function () {
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () { hero.classList.add('is-in'); });
            });
        };

        // Nothing in the hero is visible until `is-in` — the display words sit
        // inside their masks — so holding the entrance until the webfonts have
        // settled means the title can never flash a fallback face and reflow.
        // Races a 2s cap: if the font host is unreachable (it often is from
        // Iran) the hero must still arrive rather than wait on a dead request.
        if (document.fonts && document.fonts.ready && typeof Promise !== 'undefined') {
            var capped = new Promise(function (resolve) { window.setTimeout(resolve, 2000); });
            Promise.race([document.fonts.ready, capped]).then(startHero, startHero);
        } else {
            startHero();
        }
    }

    if (heroVid) {
        var heroBlocked = reduce || coarse;
        var heroPaused = heroBlocked;

        var playHero = function () {
            var p = heroVid.play();
            if (p && p.catch) p.catch(function () {});
        };

        if (heroBlocked) {
            heroVid.preload = 'none';
            if (heroPause) heroPause.setAttribute('aria-pressed', 'true');
        } else {
            heroVid.preload = 'auto';
            heroVid.load();
            playHero();
        }

        if (heroPause) {
            heroPause.addEventListener('click', function () {
                heroPaused = !heroVid.paused;
                if (heroPaused) {
                    heroVid.pause();
                } else {
                    // First press on mobile is also the consent to download it.
                    if (heroVid.preload !== 'auto') { heroVid.preload = 'auto'; heroVid.load(); }
                    playHero();
                }
                heroPause.setAttribute('aria-pressed', String(heroPaused));
            });
        }

        if (hasIO) {
            var heroIO = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        if (!heroPaused) playHero();
                    } else {
                        heroVid.pause();
                    }
                });
            }, { threshold: 0.15 });
            heroIO.observe(heroVid);
        }
    }

    /* ----------------------------------------------------------------------
       Frame reveal — the editorial blocks ride the site-wide `.reveal`
       observer; frames need their own because their hidden state is a
       clip-path, not an opacity.

       The <figure> is observed, never the frame inside it: a fully clipped
       element reports a zero intersection ratio, so a frame watching itself
       would wait forever for the reveal that removes its own clip.
       ---------------------------------------------------------------------- */
    var revealables = document.querySelectorAll('.rp-fig');

    if (reduce || !hasIO) {
        revealables.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
        var rpIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                rpIO.unobserve(entry.target);
            });
        }, { threshold: 0.14, rootMargin: '0px 0px -70px 0px' });
        revealables.forEach(function (el) { rpIO.observe(el); });
    }

    /* ----------------------------------------------------------------------
       Parallax — the photograph drifts inside a frame that is already
       oversized, so nothing can expose an edge. Amplitude is in px, declared
       per figure, and capped hard. Off entirely on touch and reduced motion.
       ---------------------------------------------------------------------- */
    var parFigs = Array.prototype.slice.call(document.querySelectorAll('[data-rp-par]'));

    if (parFigs.length && !reduce && !coarse) {
        var ticking = false;

        var runParallax = function () {
            var vh = window.innerHeight;
            parFigs.forEach(function (fig) {
                var img = fig.querySelector('.rp-frame img');
                if (!img) return;
                var box = fig.getBoundingClientRect();
                if (box.bottom < -200 || box.top > vh + 200) return;
                // -1 (entering from below) → 1 (leaving past the top)
                var progress = (vh / 2 - (box.top + box.height / 2)) / (vh / 2 + box.height / 2);
                var amp = Math.min(parseFloat(fig.getAttribute('data-rp-par')) || 30, 60);
                img.style.setProperty('--par', (progress * amp).toFixed(2) + 'px');
            });
            ticking = false;
        };

        var onScroll = function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(runParallax);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        runParallax();
    }

    /* ----------------------------------------------------------------------
       Film — minimal controls over a native <video> with the chrome hidden.
       Fullscreen falls back to the video element where the container cannot
       go fullscreen (older iOS exposes it only on the media element).
       ---------------------------------------------------------------------- */
    var stage = document.querySelector('[data-rp-film]');
    if (stage) {
        var film = stage.querySelector('[data-rp-film-video]');
        var filmToggle = stage.querySelector('[data-rp-film-toggle]');
        var filmFs = stage.querySelector('[data-rp-film-fs]');

        var syncFilm = function () {
            var playing = !film.paused && !film.ended;
            stage.classList.toggle('is-playing', playing);
            if (filmToggle) {
                filmToggle.setAttribute('aria-label', playing ? 'توقف فیلم پروژه' : 'پخش فیلم پروژه');
            }
        };

        if (filmToggle) {
            filmToggle.addEventListener('click', function () {
                if (film.paused) {
                    // Sound is the point of a project film — but a refused
                    // unmuted play must not end in silence and no picture.
                    film.muted = false;
                    var p = film.play();
                    if (p && p.catch) {
                        p.catch(function () {
                            film.muted = true;
                            film.play().catch(function () {});
                        });
                    }
                } else {
                    film.pause();
                }
            });
        }

        film.addEventListener('play', syncFilm);
        film.addEventListener('pause', syncFilm);
        film.addEventListener('ended', syncFilm);

        if (filmFs) {
            filmFs.addEventListener('click', function () {
                if (document.fullscreenElement) { document.exitFullscreen(); return; }
                if (stage.requestFullscreen) { stage.requestFullscreen().catch(function () {}); }
                else if (film.webkitEnterFullscreen) { film.webkitEnterFullscreen(); }
            });
        }

        // A film that has scrolled away should not keep playing out of sight.
        if (hasIO) {
            var filmIO = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting && !film.paused) film.pause();
                });
            }, { threshold: 0.2 });
            filmIO.observe(stage);
        }
    }

    /* ----------------------------------------------------------------------
       Lightbox — fullscreen viewing for every frame on the page.
       Focus is trapped for as long as it is open and handed back on close.
       ---------------------------------------------------------------------- */
    var lb = document.getElementById('rpLightbox');
    var frames = Array.prototype.slice.call(document.querySelectorAll('.rp-frame[data-rp-full]'));

    if (lb && frames.length) {
        var lbImg = lb.querySelector('[data-rp-lb-img]');
        var lbText = lb.querySelector('[data-rp-lb-text]');
        var lbCount = lb.querySelector('[data-rp-lb-count]');
        var lbClose = lb.querySelector('[data-rp-lb-close]');
        var lbPrev = lb.querySelector('[data-rp-lb-prev]');
        var lbNext = lb.querySelector('[data-rp-lb-next]');
        var index = 0;
        var lastFocus = null;

        var pad = function (n) { return (n < 10 ? '0' : '') + n; };

        var show = function (i) {
            index = (i + frames.length) % frames.length;
            var frame = frames[index];
            var src = frame.getAttribute('data-rp-full');
            var caption = frame.getAttribute('data-rp-caption') || '';
            var inner = frame.querySelector('img');

            lb.classList.remove('is-shown');
            var swap = function () {
                lbImg.src = src;
                lbImg.alt = inner ? inner.alt : caption;
                if (lbText) lbText.textContent = caption;
                if (lbCount) lbCount.textContent = pad(index + 1) + ' / ' + pad(frames.length);
                lb.classList.add('is-shown');
            };
            if (reduce) { swap(); } else { window.setTimeout(swap, 160); }
        };

        var onKey = function (e) {
            if (e.key === 'Escape') { close(); return; }
            if (e.key === 'ArrowLeft')  { show(index + 1); return; }   // RTL: left advances
            if (e.key === 'ArrowRight') { show(index - 1); return; }
            if (e.key !== 'Tab') return;
            // Focus trap
            var stops = [lbClose, lbPrev, lbNext].filter(Boolean);
            var first = stops[0];
            var last = stops[stops.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };

        var open = function (i, trigger) {
            lastFocus = trigger || document.activeElement;
            lb.hidden = false;
            show(i);
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () { lb.classList.add('is-open'); });
            });
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', onKey);
            if (lbClose) lbClose.focus();
        };

        function close() {
            lb.classList.remove('is-open', 'is-shown');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
            window.setTimeout(function () { lb.hidden = true; lbImg.src = ''; }, reduce ? 0 : 520);
            if (lastFocus) lastFocus.focus();
        }

        frames.forEach(function (frame, i) {
            frame.addEventListener('click', function () { open(i, frame); });
        });

        if (lbClose) lbClose.addEventListener('click', close);
        if (lbPrev) lbPrev.addEventListener('click', function () { show(index - 1); });
        if (lbNext) lbNext.addEventListener('click', function () { show(index + 1); });

        // Click on the backdrop — but not on the picture or the controls.
        lb.addEventListener('click', function (e) {
            if (e.target === lb || e.target.classList.contains('rp-lb-stage')) close();
        });
    }
})();
