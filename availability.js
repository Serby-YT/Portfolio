/* ==========================================================================
   availability — verificator de disponibilitate (NU sistem de rezervari)
   --------------------------------------------------------------------------
   Clientul alege o zi, vede daca sunt liber si primeste datele de contact.
   Fara preturi, fara avans, fara plati — asta a fost cerinta explicita.

   Se incarca DUPA i18n.js (citeste window.SiteI18n).
   Se monteaza in #availability; daca elementul lipseste, nu face nimic.

   DE CE O LUNA PE RAND: pana la 27.08.2026 site-ul servea availability.json, cu
   toate cele 731 de zile deodata. Apoi a intrebat o zi pe click — dar clientul
   trebuia sa apese pe fiecare data ca sa afle ceva, ceea ce nu mergea. Acum cere
   /api/availability/<AAAA-LL>.json: exact luna afisata, o singura cerere in loc
   de 31, si tot nu exista un fisier cu programul intreg.
   ATENTIE: asta nu face programul secret — cine vrea poate cere luna dupa luna.
   Nu prezenta asta ca pe o masura de confidentialitate.

   REGULA DE SIGURANTA — nu o slabi:
   nicio ramura de eroare nu are voie sa spuna despre o zi ca e libera.
   - meta.json lipsa, stricat sau mai vechi de 6 ore  -> nu verificam nimic
   - o interogare care da 404 / 429 / eroare de retea -> ziua ramane neconfirmata
   A-i spune unui client ca sunt liber intr-o zi in care filmez deja o nunta e
   mult mai rau decat a nu raspunde deloc.
   ========================================================================== */
(function () {
    'use strict';

    /* ---- date de contact (completeaza ce vrei sa apara) ---- */
    var CONTACT = {
        instagram: 'serby.photo',
        email: '',
        phone: '',
        whatsapp: ''
    };

    var META_URL = '/api/availability/meta.json';
    var MONTH_URL = '/api/availability/';         /* + YYYY-MM.json */
    var STALE_MS = 6 * 60 * 60 * 1000;            /* 6 ore */
    var TZ = 'Europe/Bucharest';
    var MONTHS_AHEAD = 18;

    /* Romana scrie lunile cu litera mica in text curgator ("5 septembrie 2026"),
       engleza cu majuscula ("5 September 2026"). Un .toLowerCase() neconditionat
       a stricat exact asta — de aceea e un flag per limba, nu o regula globala. */
    var LOCALES = {
        ro: { tag: 'ro-RO', lowercaseMonths: true },
        en: { tag: 'en-GB', lowercaseMonths: false }
    };

    var mount = document.getElementById('availability');
    if (!mount) return;

    /* state: 'loading' | 'ok' | 'unknown'  (unknown = nu avem voie sa afirmam nimic) */
    var state = 'loading';
    var windowFrom = null, windowTo = null;

    /* Raspunsurile primite in sesiunea asta: data -> 'free'|'busy'. */
    var answers = Object.create(null);

    /* Ce luni am cerut deja: 'AAAA-LL' -> 'loading'|'ok'|'error'. O luna se cere
       o singura data pe sesiune, oricat te-ai plimba inainte si inapoi. */
    var months = Object.create(null);

    var cursor = null;      /* prima zi a lunii afisate */
    var selected = null;

    /* ---------- helpers de limba ---------- */
    function lang() { return (window.SiteI18n && window.SiteI18n.lang) || 'ro'; }
    function loc() { return LOCALES[lang()] || LOCALES.ro; }
    function t(key) {
        return (window.SiteI18n && window.SiteI18n.t) ? window.SiteI18n.t(key) : key;
    }

    /* ---------- helpers de data (toate pe siruri YYYY-MM-DD) ---------- */

    /* "Azi" e ziua fotografului, nu a vizitatorului. Un client din UK care intra
       la 23:30 ora lui trebuie sa vada tot ziua din Romania. */
    function todayISO() {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());
    }

    function iso(y, m, d) {
        return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }

    function monthLabel(y, m) {
        var name = new Intl.DateTimeFormat(loc().tag, { month: 'long', timeZone: 'UTC' })
            .format(new Date(Date.UTC(y, m, 1)));
        /* In bara de sus luna e titlu, deci majuscula in ambele limbi. */
        return name.charAt(0).toUpperCase() + name.slice(1) + ' ' + y;
    }

    /* Data in text curgator — aici conteaza flagul de mai sus. */
    function longDate(isoStr) {
        var p = isoStr.split('-');
        var dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
        var month = new Intl.DateTimeFormat(loc().tag, { month: 'long', timeZone: 'UTC' }).format(dt);
        month = loc().lowercaseMonths ? month.toLowerCase()
                                      : month.charAt(0).toUpperCase() + month.slice(1);
        return (+p[2]) + ' ' + month + ' ' + p[0];
    }

    /* Luni = 0. Calendarul romanesc incepe luni, nu duminica. */
    function firstWeekday(y, m) { return (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; }
    function daysInMonth(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }

    /* ---------- meta (prospetimea datelor) ---------- */
    function loadMeta() {
        return fetch(META_URL, { cache: 'no-store' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) {
                var gen = Date.parse(data.generated_at);
                if (!gen || (Date.now() - gen) > STALE_MS) {
                    state = 'unknown';           /* date invechite = nu afirmam nimic */
                    return;
                }
                windowFrom = (data.window && data.window.from) || null;
                windowTo = (data.window && data.window.to) || null;
                state = 'ok';
            })
            .catch(function () {
                state = 'unknown';               /* retea cazuta, 404, JSON stricat */
            });
    }

    /* ---------- interogarea unei luni ---------- */
    function ensureMonth(y, m) {
        var key = y + '-' + String(m + 1).padStart(2, '0');
        if (months[key]) return;                 /* deja ceruta in sesiunea asta */
        months[key] = 'loading';

        fetch(MONTH_URL + key + '.json', { cache: 'no-store' })
            .then(function (r) {
                /* 429 = limita de rata. NU inseamna "liber" — inseamna "nu stiu". */
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (d) {
                var days = d && d.days;
                if (!days || typeof days !== 'object') throw new Error('raspuns fara zile');
                /* Doar valorile pe care le recunoastem ajung in answers. Orice
                   altceva ramane negasit, adica "nu pot confirma". */
                Object.keys(days).forEach(function (k) {
                    if (days[k] === 'free' || days[k] === 'busy') answers[k] = days[k];
                });
                months[key] = 'ok';
            })
            .catch(function () {
                months[key] = 'error';
            })
            .then(render);
    }

    /* ---------- clasificarea unei zile ---------- */
    function classify(isoStr, today) {
        if (isoStr < today) return 'past';
        if (state !== 'ok') return 'unknown';
        if (windowFrom && isoStr < windowFrom) return 'unknown';
        if (windowTo && isoStr > windowTo) return 'unknown';
        /* Cat timp luna e pe drum aratam "verific", nu "nu pot confirma":
           altfel calendarul clipeste din liniute in puncte la fiecare incarcare. */
        var st = months[isoStr.slice(0, 7)];
        if (!st || st === 'loading') return 'checking';
        if (st !== 'ok') return 'unknown';        /* 429, 404, retea cazuta */

        var a = answers[isoStr];
        if (a === 'free') return 'free';
        if (a === 'busy') return 'busy';
        return 'unknown';                         /* zi in afara ferestrei */
    }

    /* Se pot apasa doar zilele despre care avem un raspuns — clicul nu mai
       interogheaza nimic, doar deschide caseta cu datele de contact. */
    function isClickable(kind) {
        return kind === 'free' || kind === 'busy';
    }

    /* ---------- randare ---------- */
    function render() {
        var today = todayISO();
        var ty = +today.slice(0, 4), tm = +today.slice(5, 7) - 1;
        if (!cursor) cursor = { y: ty, m: tm };

        var y = cursor.y, m = cursor.m;
        if (state === 'ok') ensureMonth(y, m);
        var atStart = (y === ty && m === tm);
        var atEnd = (y * 12 + m) >= (ty * 12 + tm + MONTHS_AHEAD);

        var dow = ['1', '2', '3', '4', '5', '6', '7'].map(function (n) {
            return '<span>' + t('availability.dow.' + n) + '</span>';
        }).join('');

        var cells = '';
        var lead = firstWeekday(y, m);
        for (var i = 0; i < lead; i++) cells += '<div class="av-day av-empty" aria-hidden="true"></div>';

        var total = daysInMonth(y, m);
        for (var d = 1; d <= total; d++) {
            var isoStr = iso(y, m, d);
            var kind = classify(isoStr, today);
            var clickable = isClickable(kind);
            var aria = t('availability.aria.' + (kind === 'past' ? 'past' : kind));
            cells +=
                '<' + (clickable ? 'button type="button"' : 'div') +
                ' class="av-day av-' + kind + (selected === isoStr ? ' av-selected' : '') + '"' +
                ' data-date="' + isoStr + '"' +
                ' aria-label="' + longDate(isoStr) + ' — ' + aria + '"' +
                (clickable ? '' : ' aria-disabled="true"') + '>' +
                '<span>' + d + '</span><i class="av-dot"></i>' +
                '</' + (clickable ? 'button' : 'div') + '>';
        }

        mount.innerHTML =
            '<div class="av-wrap">' +
              '<div class="av-head">' +
                '<h2 class="av-title" id="availability-title">' + t('availability.title') + '</h2>' +
                '<p class="av-sub">' + t('availability.sub') + '</p>' +
              '</div>' +
              '<div class="av-notice"' + (state === 'ok' ? ' hidden' : '') + '>' +
                t('availability.notice.stale') +
              '</div>' +
              '<div class="av-bar">' +
                '<div class="av-month">' + monthLabel(y, m) + '</div>' +
                '<div class="av-nav">' +
                  '<button type="button" class="av-arrow" data-step="-1"' + (atStart ? ' disabled' : '') +
                    ' aria-label="' + t('availability.prev') + '">&#8592;</button>' +
                  '<button type="button" class="av-arrow" data-step="1"' + (atEnd ? ' disabled' : '') +
                    ' aria-label="' + t('availability.next') + '">&#8594;</button>' +
                '</div>' +
              '</div>' +
              '<div class="av-dow" aria-hidden="true">' + dow + '</div>' +
              '<div class="av-grid" role="group" aria-label="' + t('availability.title') + '">' + cells + '</div>' +
              (state === 'ok' ? '<p class="av-hint">' + t('availability.hint') + '</p>' : '') +
              '<div class="av-legend">' +
                '<span><i class="l-free"></i>' + t('availability.legend.free') + '</span>' +
                '<span><i class="l-busy"></i>' + t('availability.legend.busy') + '</span>' +
                '<span><i class="l-unknown"></i>' + t('availability.legend.unknown') + '</span>' +
              '</div>' +
              '<div class="av-result" role="status" aria-live="polite" hidden></div>' +
            '</div>';

        wire();
        if (selected) showResult(selected);
    }

    function wire() {
        mount.querySelectorAll('.av-arrow').forEach(function (b) {
            b.addEventListener('click', function () {
                var abs = cursor.y * 12 + cursor.m + (+b.getAttribute('data-step'));
                cursor = { y: Math.floor(abs / 12), m: abs % 12 };
                render();
            });
        });
        mount.querySelectorAll('button.av-day').forEach(function (b) {
            b.addEventListener('click', function () {
                selected = b.getAttribute('data-date');
                render();
            });
        });
    }

    function showResult(isoStr) {
        var box = mount.querySelector('.av-result');
        if (!box) return;
        var kind = classify(isoStr, todayISO());

        if (kind === 'checking') {
            box.innerHTML = t('availability.checking');
            box.hidden = false;
            return;
        }
        if (kind === 'unknown') {
            /* Include 429 si erorile de retea. Niciodata "liber". */
            box.innerHTML = '<strong>' + t('availability.error.title') + '</strong><br>' +
                            t('availability.error.body');
            box.hidden = false;
            return;
        }
        if (kind === 'busy') {
            box.innerHTML = '<strong>' + t('availability.busy.title').replace('{date}', longDate(isoStr)) +
                            '</strong><br>' + t('availability.busy.body');
            box.hidden = false;
            return;
        }
        if (kind !== 'free') { box.hidden = true; return; }

        var links = '<a href="#contact" data-av-contact>' + t('availability.cta.contact') + '</a>';
        if (CONTACT.instagram) {
            links += '<a href="https://instagram.com/' + CONTACT.instagram +
                     '" target="_blank" rel="noopener">' + t('availability.cta.instagram') + '</a>';
        }
        if (CONTACT.email) links += '<a href="mailto:' + CONTACT.email + '">' + CONTACT.email + '</a>';
        if (CONTACT.whatsapp) {
            links += '<a href="https://wa.me/' + CONTACT.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a>';
        } else if (CONTACT.phone) {
            links += '<a href="tel:' + CONTACT.phone + '">' + CONTACT.phone + '</a>';
        }

        box.innerHTML =
            '<strong>' + t('availability.free.title').replace('{date}', longDate(isoStr)) + '</strong><br>' +
            t('availability.free.body') +
            '<div class="av-result-actions">' + links + '</div>';
        box.hidden = false;

        var jump = box.querySelector('[data-av-contact]');
        if (jump) {
            jump.addEventListener('click', function () {
                /* Precompletam mesajul cu data aleasa — asta era problema initiala:
                   cererile ajungeau fara data si urma un schimb intreg de mesaje. */
                var ta = document.getElementById('message');
                if (ta) {
                    ta.value = t('availability.prefill').replace('{date}', longDate(isoStr));
                    ta.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }
    }

    loadMeta().then(render);

    /* Limba traieste in URL, deci in practica pagina se reincarca la schimbare.
       Ascultam totusi evenimentul: e ieftin si acopera cazul in care s-ar
       reintroduce comutarea fara navigare. */
    document.addEventListener('sitelanguagechange', render);
})();
