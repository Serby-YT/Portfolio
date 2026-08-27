/* ==========================================================================
   i18n — schimbare limba RO / EN
   --------------------------------------------------------------------------
   Se incarca INAINTEA lui script.js / collections.js, ca ele sa poata citi
   limba curenta prin window.SiteI18n.

   Cum functioneaza:
   - textul static din HTML e marcat cu data-i18n="cheie"
     (sau data-i18n-placeholder / data-i18n-aria-label / data-i18n-alt)
   - textul generat din JS se cere cu window.SiteI18n.t('cheie')
   - la schimbarea limbii se emite evenimentul 'sitelanguagechange' pe document,
     ca script.js / collections.js sa poata re-randa ce au construit dinamic.
   ========================================================================== */
(function () {
    'use strict';

    var STORAGE_KEY = 'siteLang';
    var SUPPORTED = ['ro', 'en'];
    var DEFAULT_LANG = 'ro';

    var STRINGS = {
        ro: {
            'meta.title.home': 'Anița Șerban Photography | Fotograf de evenimente',
            'meta.title.collections': 'Colecții | Anița Șerban Photography',
            'meta.description.home': 'Fotograf de evenimente și momente speciale — nunți, botezuri, majorate și concerte. Galerii complete, livrate rapid, care spun povestea zilei tale.',
            'meta.description.collections': 'Colecții de fotografie semnate de Anița Șerban — călătorii, natură și proiecte personale din România, Ungaria și Marea Britanie.',
            'meta.title.video': 'Video | Anița Șerban Photography',
            'meta.description.video': 'Proiecte video de Anița Șerban — filmări de eveniment și proiecte personale, fiecare cu povestea din spatele cadrelor.',

            'meta.title.portfolio': 'Portofoliu | Anița Șerban Photography',
            'meta.description.portfolio': 'Portofoliu de fotografie: evenimente, portrete, călătorii, natură și produs. Lucrări selectate de Anița Șerban, fotograf de eveniment în România.',

            'nav.theme.label': 'Schimbă tema',

            'landing.eyebrow': 'Anița Șerban — Fotografie de eveniment · România',
            'landing.headline': 'Emoția, surprinsă la timp.',
            'landing.bio': 'Nu caut zâmbete perfect aranjate — caut emoția, atmosfera și detaliile pe care le vei ține minte ani întregi.',
            'landing.cta.portfolio': 'Portofoliu',
            'landing.cta.video': 'Video',
            'landing.cta.collections': 'Colecții',
            'landing.cta.contact': 'Contact',

            'categories.badge': 'Portofoliu',
            'categories.title': 'De unde vrei să începi?',

            'band.badge': 'Colecții',
            'band.title': 'Locuri, adunate pe rând.',
            'band.body': 'Seturi separate de fotografii — călătorii, natură și proiecte, fiecare cu galeria ei.',
            'band.cta': 'Vezi colecțiile',

            'testimonials.badge': 'Testimoniale',
            'testimonials.title': 'Ce spun oamenii.',
            'testimonials.sample': 'Exemplu',
            'testimonials.1.text': '„Ne-a prins exact momentele pe care nu le-am văzut noi în ziua nunții. Când am deschis galeria, am plâns. Serios.”',
            'testimonials.1.role': 'Nuntă',
            'testimonials.2.text': '„Nici nu am simțit că e cineva cu aparatul prin sală. Iar pozele au ieșit ca dintr-un film. Exact atmosfera de la majorat.”',
            'testimonials.2.role': 'Majorat',
            'testimonials.3.text': '„Am primit galeria mult mai repede decât mă așteptam și toată familia a putut să o descarce fără bătăi de cap.”',
            'testimonials.3.role': 'Botez',
            'testimonials.4.text': '„Am ales-o pe recomandare și n-am regretat nicio secundă. Discretă la ceremonie, dar n-a ratat niciun moment important.”',
            'testimonials.4.role': 'Cununie civilă',
            'testimonials.5.text': '„Poze curate, profesioniste, exact ce ne trebuia pentru evenimentul firmei. Aș fi vrut câteva cadre de grup în plus, dar per total suntem mulțumiți.”',
            'testimonials.5.role': 'Eveniment corporate',
            'testimonials.6.text': '„A prins toată energia petrecerii. Bunicii au râs, copiii au dansat — și avem totul în poze.”',
            'testimonials.6.role': 'Aniversare',

            'lightbox.back': '← Înapoi la galerie',
            'lightbox.close': 'Închide',
            'lightbox.prev': 'Imaginea anterioară',
            'lightbox.next': 'Imaginea următoare',
            'lightbox.alt': 'Imagine mărită',

            'nav.home': 'Acasă',
            'nav.work': 'Portofoliu',
            'nav.collections': 'Colecții',
            'nav.video': 'Video',
            'nav.about': 'Despre',
            'nav.contact': 'Contact',
            'nav.lang.label': 'Schimbă limba',

            'hero.marquee': 'ATMOSFERE &middot; PEISAJE &middot; MOMENTE &middot; ',
            'hero.title.line1': 'În căutarea',
            'hero.title.line2': 'Atmosferei',
            'hero.subtitle': 'Peisaje atmosferice & evenimente autentice',
            'hero.cta.work': 'Vezi portofoliul',
            'hero.cta.collections': 'Colecții',
            'hero.scroll': 'Explorează',

            'portfolio.badge': 'Lucrări selectate',
            'portfolio.title': 'Portofoliu',
            'portfolio.tab.all': 'Toate',
            'portfolio.photo.alt': 'Fotografie de Anița Șerban',

            'stats.years': 'Ani de fotografie',
            'stats.events': 'Evenimente',
            'stats.photos': 'Fotografii livrate',
            'stats.videos': 'Videoclipuri',

            'timeline.badge': 'Parcursul meu',
            'timeline.title': 'Cum am ajuns aici.',
            'timeline.1.year': '2024',
            'timeline.1.head': 'Primul declanșator',
            'timeline.1.body': 'Am început să fotografiez ca hobby — învățând lumina, compoziția și răbdarea de a aștepta cadrul potrivit în loc să îl forțez.',
            'timeline.2.year': 'Ianuarie 2026',
            'timeline.2.head': 'Primul eveniment',
            'timeline.2.body': 'Un prieten m-a chemat să fotografiez primul meu eveniment. A fost momentul în care hobby-ul a devenit altceva — de atunci nu m-am mai oprit.',
            'timeline.3.year': 'Azi',
            'timeline.3.head': 'Aproape în fiecare weekend',
            'timeline.3.body': 'Majorate, nunți, botezuri, concerte. Fiecare eveniment mi-a șlefuit stilul și tehnica, iar acum livrez rapid o galerie completă care spune povestea zilei tale.',

            'why.badge': 'De ce eu',
            'why.title': 'Ce primești, de fapt.',
            'why.1.head': 'Povestea, nu doar poza',
            'why.1.body': 'Nu caut zâmbete perfect aranjate. Caut momentele dintre ele — emoția, atmosfera și detaliile pe care nu le observi în ziua respectivă, dar le vei ține minte ani întregi.',
            'why.2.head': 'Livrare rapidă',
            'why.2.body': 'Nu aștepți luni de zile. Primești o galerie completă, editată și ușor de descărcat sau de trimis mai departe familiei, la scurt timp după eveniment.',
            'why.3.head': 'Experiență în evenimente reale',
            'why.3.body': 'Peste 70 de evenimente — majorate, nunți, botezuri și concerte. Știu unde să stau, când să apăs și cum să nu fiu în calea momentului tău.',

            'contact.title': 'Contact',
            'contact.sub': 'Disponibil pentru colaborări oricând.',
            'contact.name': 'Nume',
            'contact.email': 'Email',
            'contact.message.placeholder': 'Mesaj / Solicitare',
            'contact.message.label': 'Spune-mi povestea ta',
            'contact.send': 'Trimite mesajul',
            /* ---- verificator de disponibilitate (nu rezervari, fara preturi) ---- */
            'availability.title': 'Sunt liber atunci?',
            'availability.sub': 'Alege data evenimentului și vezi pe loc dacă sunt liber. Fără formular lung și fără așteptare.',
            'availability.legend.free': 'Liber',
            'availability.legend.busy': 'Ocupat',
            'availability.legend.unknown': 'Nu pot confirma',
            'availability.notice.stale': 'Nu pot confirma disponibilitatea acum — scrie-mi și îți răspund repede.',
            'availability.free.title': 'Sunt liber pe {date}.',
            'availability.free.body': 'Scrie-mi și stăm de vorbă despre eveniment.',
            'availability.prefill': 'Bună! Aș vrea să te întreb de disponibilitate pentru {date}.',
            'availability.cta.contact': 'Scrie-mi despre această zi',
            'availability.cta.instagram': 'Instagram',
            'availability.prev': 'Luna anterioară',
            'availability.next': 'Luna următoare',
            'availability.aria.free': 'liber',
            'availability.aria.busy': 'ocupat',
            'availability.aria.unknown': 'nu pot confirma',
            'availability.aria.past': 'zi trecută',
            'availability.dow.1': 'Lu',
            'availability.dow.2': 'Ma',
            'availability.dow.3': 'Mi',
            'availability.dow.4': 'Jo',
            'availability.dow.5': 'Vi',
            'availability.dow.6': 'Sâ',
            'availability.dow.7': 'Du',

            'footer.copyright': '© 2026 Anița Șerban. Toate drepturile rezervate.',
            'footer.privacy': 'Politică de Confidențialitate',

            'meta.title.privacy': 'Politică de Confidențialitate | Anița Șerban Photography',
            'meta.description.privacy': 'Ce date colectăm prin formularul de contact, ce cookie-uri folosim și cum îți poți exercita drepturile GDPR.',

            'cookie.notice': 'Acest site nu folosește cookie-uri de analiză sau marketing. Doar un cookie strict necesar, de securitate, poate fi setat automat.',
            'cookie.link': 'Detalii',
            'cookie.accept': 'Am înțeles',

            'collections.badge': 'Explorează',
            'collections.title': 'Colecții',
            'collections.back': '← Toate colecțiile',
            'collections.empty': 'Momentan nu este nimic aici — revino curând.',
            'collections.notfound': 'Colecția nu a fost găsită',

            /* Pagina Video */
            'video.badge': 'Filme',
            'video.title': 'Proiecte video',
            'video.back': '← Toate proiectele',
            'video.empty': 'Momentan nu este niciun proiect aici — revino curând.',
            'video.notfound': 'Proiectul nu a fost găsit',
            'video.tab.all': 'Toate',
            'video.script': 'Scenariu',
            'video.full': 'Filmul complet',
            'video.full.play': 'Pornește filmul',
            'video.reel.badge': 'Showreel',
            'video.reel.title': 'Imagini care se mișcă.',
            'video.reel.body': 'Un minut din ce am filmat anul acesta.',
            'video.reel.sound': 'Pornește sunetul',
            'videoband.badge': 'Video',
            'videoband.title': 'Și când cadrul se mișcă.',
            'videoband.body': 'Filme de eveniment și proiecte personale — fiecare cu povestea, scenariul și cadrele din spate.',
            'videoband.cta': 'Vezi proiectele video',
            'split.photo': 'Fotografie',
            'split.video': 'Video',
            'collections.count.one': 'fotografie',
            'collections.count.many': 'fotografii'
        },

        en: {
            'meta.title.home': 'Anița Șerban Photography | Event Photographer',
            'meta.title.collections': 'Collections | Anița Șerban Photography',
            'meta.description.home': 'Photographing events and special moments — weddings, christenings, birthdays and concerts. Complete galleries, delivered fast, telling the story of your day.',
            'meta.description.collections': 'Photography collections by Anița Șerban — travel, nature and personal projects from Romania, Hungary and the United Kingdom.',
            'meta.title.video': 'Video | Anița Șerban Photography',
            'meta.description.video': 'Video projects by Anița Șerban — event films and personal work, each with the story behind the frames.',

            'meta.title.portfolio': 'Portfolio | Anița Șerban Photography',
            'meta.description.portfolio': 'Photography portfolio: events, portraits, travel, nature and product. Selected work by Anița Șerban, event photographer in Romania.',

            'nav.theme.label': 'Change theme',

            'landing.eyebrow': 'Anița Șerban — Event Photography · Romania',
            'landing.headline': 'Emotion, caught in time.',
            'landing.bio': "I'm not after perfectly arranged smiles — I go for the emotion, the atmosphere, and the details you'll remember for years.",
            'landing.cta.portfolio': 'Portfolio',
            'landing.cta.video': 'Video',
            'landing.cta.collections': 'Collections',
            'landing.cta.contact': 'Contact',

            'categories.badge': 'Portfolio',
            'categories.title': 'Where would you like to start?',

            'band.badge': 'Collections',
            'band.title': 'Places, gathered one by one.',
            'band.body': 'Separate sets of photographs — travels, nature and projects, each with its own gallery.',
            'band.cta': 'View the collections',

            'testimonials.badge': 'Testimonials',
            'testimonials.title': 'What people say.',
            'testimonials.sample': 'Sample',
            'testimonials.1.text': '“He caught exactly the moments we never saw on our wedding day. When I opened the gallery, I cried. Genuinely.”',
            'testimonials.1.role': 'Wedding',
            'testimonials.2.text': '“I never even noticed someone with a camera in the room. And the photos came out like a film. Exactly the mood of the night.”',
            'testimonials.2.role': 'Birthday',
            'testimonials.3.text': '“I got the gallery far sooner than I expected, and the whole family could download it without any hassle.”',
            'testimonials.3.role': 'Christening',
            'testimonials.4.text': '“I booked her on a recommendation and didn’t regret it for a second. Discreet during the ceremony, but didn’t miss a single important moment.”',
            'testimonials.4.role': 'Civil wedding',
            'testimonials.5.text': '“Clean, professional photos, exactly what we needed for the company event. I’d have liked a few more group shots, but overall we’re happy.”',
            'testimonials.5.role': 'Corporate event',
            'testimonials.6.text': '“She caught the whole energy of the party. The grandparents laughed, the kids danced — and we have all of it in photos.”',
            'testimonials.6.role': 'Anniversary',

            'lightbox.back': '← Back to gallery',
            'lightbox.close': 'Close',
            'lightbox.prev': 'Previous image',
            'lightbox.next': 'Next image',
            'lightbox.alt': 'Enlarged view',

            'nav.home': 'Home',
            'nav.work': 'Work',
            'nav.collections': 'Collections',
            'nav.video': 'Video',
            'nav.about': 'About',
            'nav.contact': 'Contact',
            'nav.lang.label': 'Change language',

            'hero.marquee': 'ATMOSPHERES &middot; LANDSCAPES &middot; MOMENTS &middot; ',
            'hero.title.line1': 'Chasing',
            'hero.title.line2': 'Atmospheres',
            'hero.subtitle': 'Moody Landscapes & Authentic Events',
            'hero.cta.work': 'Discover Work',
            'hero.cta.collections': 'Collections',
            'hero.scroll': 'Explore',

            'portfolio.badge': 'Selected Works',
            'portfolio.title': 'Portfolio',
            'portfolio.tab.all': 'All',
            'portfolio.photo.alt': 'Photo by Anița Șerban',

            'stats.years': 'Years shooting',
            'stats.events': 'Events',
            'stats.photos': 'Photos delivered',
            'stats.videos': 'Videos',

            'timeline.badge': 'My journey',
            'timeline.title': 'How I got here.',
            'timeline.1.year': '2024',
            'timeline.1.head': 'The first shutter',
            'timeline.1.body': 'I picked up photography as a hobby — learning light, composition, and the patience to wait for the right frame instead of forcing it.',
            'timeline.2.year': 'January 2026',
            'timeline.2.head': 'The first event',
            'timeline.2.body': 'A friend asked me to shoot my first event. That was the moment the hobby became something else — I have not stopped since.',
            'timeline.3.year': 'Today',
            'timeline.3.head': 'Almost every weekend',
            'timeline.3.body': 'Birthdays, weddings, christenings, concerts. Every event has sharpened my style and technique, and now I deliver a complete gallery, fast, that tells the story of your day.',

            'why.badge': 'Why me',
            'why.title': 'What you actually get.',
            'why.1.head': 'The story, not just the photo',
            'why.1.body': 'I am not after perfectly arranged smiles. I am after the moments in between — the emotion, the atmosphere, and the details you never notice on the day but will remember for years.',
            'why.2.head': 'Fast delivery',
            'why.2.body': 'No waiting for months. You get a complete, edited gallery that is easy to download or pass on to family, shortly after the event.',
            'why.3.head': 'Real event experience',
            'why.3.body': 'Over 70 events — birthdays, weddings, christenings and concerts. I know where to stand, when to press the shutter, and how to stay out of your moment.',

            'contact.title': 'Contact',
            'contact.sub': 'Available for commissions anytime.',
            'contact.name': 'Name',
            'contact.email': 'Email',
            'contact.message.placeholder': 'Message / Inquiry',
            'contact.message.label': 'Tell me your story',
            'contact.send': 'Send message',
            /* ---- availability checker (not booking, no prices) ---- */
            'availability.title': 'Am I free then?',
            'availability.sub': 'Pick your event date and see straight away whether the day is open. No long form, no waiting.',
            'availability.legend.free': 'Free',
            'availability.legend.busy': 'Booked',
            'availability.legend.unknown': 'Can’t confirm',
            'availability.notice.stale': 'I can’t confirm availability right now — send me a message and I’ll reply quickly.',
            'availability.free.title': '{date} is free.',
            'availability.free.body': 'Send me a message and let’s talk about your event.',
            'availability.prefill': 'Hi! I’d like to ask about your availability for {date}.',
            'availability.cta.contact': 'Message me about this day',
            'availability.cta.instagram': 'Instagram',
            'availability.prev': 'Previous month',
            'availability.next': 'Next month',
            'availability.aria.free': 'free',
            'availability.aria.busy': 'booked',
            'availability.aria.unknown': 'cannot confirm',
            'availability.aria.past': 'past day',
            'availability.dow.1': 'Mon',
            'availability.dow.2': 'Tue',
            'availability.dow.3': 'Wed',
            'availability.dow.4': 'Thu',
            'availability.dow.5': 'Fri',
            'availability.dow.6': 'Sat',
            'availability.dow.7': 'Sun',

            'footer.copyright': '© 2026 Anița Șerban. All rights reserved.',
            'footer.privacy': 'Privacy Policy',

            'meta.title.privacy': 'Privacy Policy | Anița Șerban Photography',
            'meta.description.privacy': 'What data we collect through the contact form, what cookies we use, and how to exercise your GDPR rights.',

            'cookie.notice': 'This site uses no analytics or marketing cookies. Only a strictly necessary security cookie may be set automatically.',
            'cookie.link': 'Details',
            'cookie.accept': 'Got it',

            'collections.badge': 'Explore',
            'collections.title': 'Collections',
            'collections.back': '← All collections',
            'collections.empty': 'Nothing here yet — check back soon.',
            'collections.notfound': 'Collection not found',

            /* Video page */
            'video.badge': 'Films',
            'video.title': 'Video projects',
            'video.back': '← All projects',
            'video.empty': 'No projects here yet — check back soon.',
            'video.notfound': 'Project not found',
            'video.tab.all': 'All',
            'video.script': 'Script',
            'video.full': 'The full film',
            'video.full.play': 'Play the film',
            'video.reel.badge': 'Showreel',
            'video.reel.title': 'Frames that move.',
            'video.reel.body': 'A minute of what I shot this year.',
            'video.reel.sound': 'Turn on the sound',
            'videoband.badge': 'Video',
            'videoband.title': 'And when the frame moves.',
            'videoband.body': 'Event films and personal projects — each with the story, the script and the frames behind it.',
            'videoband.cta': 'See the video projects',
            'split.photo': 'Photography',
            'split.video': 'Video',
            'collections.count.one': 'photo',
            'collections.count.many': 'photos'
        }
    };

    /* Numele sectiunilor si ale colectiilor sunt DATELE utilizatorului (stocate
       in romana in manifest.json). Le traducem doar la afisare — datele si
       adresele URL raman neatinse, ca sa nu se strice linkurile existente. */
    var DATA_NAMES_EN = {
        'Evenimente': 'Events',
        'Călătorii': 'Travel',
        'Natură': 'Nature',
        'Produs': 'Product',
        'Portrete': 'Portraits',
        'Marea Britanie': 'United Kingdom',
        'Ungaria': 'Hungary',
        'Italia': 'Italy',
        'Croația': 'Croatia',
        'România': 'Romania',
        /* Video: categorii de proiect si roluri */
        'Proiecte': 'Projects',
        'Regie': 'Directing',
        'Filmare': 'Cinematography',
        'Montaj': 'Editing',
        'Color': 'Color grade',
        'Sunet': 'Sound',
        'Dronă': 'Drone',
        'Tehnic': 'Technical'
    };

    /* -----------------------------------------------------------------
       Limba sta in URL, nu in localStorage si nu in navigator.
       Romana traieste in radacina (/portfolio.html), engleza sub /en/
       (/en/portfolio.html). Fiecare varianta e o pagina reala, cu
       hreflang intre ele — altfel engleza nu putea fi indexata deloc.
       ----------------------------------------------------------------- */
    function pathLang(pathname) {
        return /^\/en(\/|$)/.test(pathname || '') ? 'en' : 'ro';
    }

    function detectLang() {
        return pathLang(location.pathname);
    }

    /* URL-ul aceleiasi pagini in cealalta limba, cu query si hash pastrate
       (conteaza pentru video.html?p=... si collections.html?g=...). */
    function counterpartUrl(lang) {
        var path = location.pathname;
        var rest = location.search + location.hash;
        var bare = path.replace(/^\/en(?=\/|$)/, '') || '/';
        if (bare === '/index.html') bare = '/';
        return (lang === 'en' ? '/en' + (bare === '/' ? '/' : bare) : bare) + rest;
    }

    var currentLang = detectLang();

    function t(key) {
        var table = STRINGS[currentLang] || STRINGS[DEFAULT_LANG];
        if (table && table[key] != null) return table[key];
        var fallback = STRINGS[DEFAULT_LANG];
        return (fallback && fallback[key] != null) ? fallback[key] : key;
    }

    /* Traduce un nume venit din manifest (sectiune sau colectie) doar pentru afisare */
    function dataName(name) {
        if (currentLang === 'en' && DATA_NAMES_EN[name]) return DATA_NAMES_EN[name];
        return name;
    }

    function applyStatic() {
        document.documentElement.setAttribute('lang', currentLang);

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var val = t(key);
            // cateva chei contin entitati HTML (ex. &middot;) — le lasam sa se randeze
            if (val.indexOf('&') !== -1) el.innerHTML = val;
            else el.textContent = val;
        });

        [['data-i18n-placeholder', 'placeholder'],
         ['data-i18n-aria-label', 'aria-label'],
         ['data-i18n-alt', 'alt'],
         ['data-i18n-title', 'title']].forEach(function (pair) {
            document.querySelectorAll('[' + pair[0] + ']').forEach(function (el) {
                el.setAttribute(pair[1], t(el.getAttribute(pair[0])));
            });
        });

        var titleKey = document.documentElement.getAttribute('data-page-title-key');
        if (titleKey) document.title = t(titleKey);

        var descKey = document.documentElement.getAttribute('data-page-desc-key');
        if (descKey) {
            var meta = document.querySelector('meta[name="description"]');
            if (meta) meta.setAttribute('content', t(descKey));
        }

        document.querySelectorAll('[data-lang-option]').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-lang-option') === currentLang);
            btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-option') === currentLang));
        });
    }

    function setLang(lang) {
        if (SUPPORTED.indexOf(lang) === -1 || lang === currentLang) return;
        currentLang = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* mod privat */ }
        applyStatic();
        document.dispatchEvent(new CustomEvent('sitelanguagechange', { detail: { lang: lang } }));
    }

    window.SiteI18n = {
        get lang() { return currentLang; },
        t: t,
        dataName: dataName,
        setLang: setLang,
        counterpartUrl: counterpartUrl,
        strings: STRINGS,
        dataNamesEn: DATA_NAMES_EN
    };

    document.addEventListener('DOMContentLoaded', function () {
        applyStatic();
        document.querySelectorAll('[data-lang-option]').forEach(function (btn) {
            var lang = btn.getAttribute('data-lang-option');
            // Ancore reale, nu doar butoane: crawlerul vede legatura dintre
            // cele doua variante si utilizatorul poate deschide in tab nou.
            if (btn.tagName === 'A') btn.setAttribute('href', counterpartUrl(lang));
            btn.addEventListener('click', function (ev) {
                if (lang === currentLang) { ev.preventDefault(); return; }
                ev.preventDefault();
                location.href = counterpartUrl(lang);
            });
        });
    });
})();
