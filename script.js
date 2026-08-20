document.addEventListener('DOMContentLoaded', () => {
    /* 1. Cursorul personalizat a fost scos — folosim cursorul normal al
       sistemului, deci nu mai desenam punctul si cercul care il urmarea. */

    /* 2. Efectul magnetic: elementele se apropie usor de cursor la hover.
       Pe ecrane tactile nu are sens, deci il pornim doar unde exista un
       dispozitiv de indicare fin (mouse / trackpad). */
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (finePointer && !reduceMotion) {
        /* Doar butoanele si elementele marcate explicit .magnetic — nu fiecare
           link. Un gest intentionat citeste ca premium; totul care se misca sub
           cursor citeste ca zgomot. Forta e mai mica, iar revenirea are o mica
           amortizare, ca sa para "greu" / lichid, nu smucit. */
        document.querySelectorAll('.magnetic-btn, .magnetic').forEach(el => {
            const strength = 0.2;
            const prev = el.style.transition;
            el.style.transition = (prev ? prev + ', ' : '') + 'transform 0.45s var(--ease-out-expo)';
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translate(0px, 0px)';
            });
        });
    }

    /* 3. Scroll & Parallax */
    const nav = document.getElementById('main-navigation');
    const hasPresetDelay = (el) =>
        el.classList.contains('delay-1') || el.classList.contains('delay-2') || el.classList.contains('delay-3');
    const observer = new IntersectionObserver((entries, obs) => {
        // Elementele care intra in acelasi cadru primesc o mica intarziere in
        // cascada, ca sa curga unul dupa altul (max ~0.48s), nu toate deodata.
        const shown = entries.filter(e => e.isIntersecting);
        shown.forEach((entry, i) => {
            const el = entry.target;
            if (!reduceMotion && !hasPresetDelay(el) && !el.style.transitionDelay) {
                el.style.transitionDelay = (Math.min(i, 6) * 0.08) + 's';
            }
            el.classList.add('visible');
            // Dupa ce intrarea s-a terminat, eliberam stratul de compozitie.
            el.addEventListener('transitionend', () => el.classList.add('is-settled'), { once: true });
            obs.unobserve(el); // o data aparut, nu-l mai urmarim
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    window.observer = observer;
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    /* Plasa de siguranta: continutul deja vizibil la incarcare apare imediat,
       chiar daca observer-ul intarzie prima notificare. Asa nu ramane niciodata
       o sectiune goala sus in pagina. (Placile de galerie se adauga mai tarziu
       si sunt gestionate tot de observer, deci nu le atingem aici.) */
    requestAnimationFrame(() => {
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.top < window.innerHeight * 0.9 && r.bottom > 0) {
                el.classList.add('visible');
                observer.unobserve(el);
            }
        });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });

    /* 3b. Count-up pentru cifrele din secțiunea Statistici */
    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (counters.length) {
        const runCounter = (el) => {
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || '';
            const duration = 1600;
            const start = performance.now();
            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // frânare lina la final
                el.textContent = Math.round(target * eased).toLocaleString('ro-RO') + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.counted) {
                    entry.target.dataset.counted = 'true';
                    runCounter(entry.target);
                }
            });
        }, { threshold: 0.4 });

        counters.forEach(el => counterObserver.observe(el));
    }

    /* 3c. Comutator de tema (clar/inchis).
       Tema initiala e deja aplicata de scriptul inline din <head>, ca sa nu
       apara un flash de culoare gresita inainte de randare. */
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('siteTheme', next); } catch (e) { /* mod privat */ }
        });
    }
    // Daca utilizatorul nu a ales manual, urmam setarea sistemului si cand se schimba
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            let saved = null;
            try { saved = localStorage.getItem('siteTheme'); } catch (err) { /* ignoram */ }
            if (!saved) document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
        });
    }

    /* 3d0. Un singur fetch de manifest pe pagina, refolosit de carusel si placi */
    const fetchManifest = (() => {
        let promise = null;
        return () => {
            if (!promise) {
                promise = fetch(`./assets/manifest.json?v=${Date.now()}`)
                    .then(r => r.ok ? r.json() : {})
                    .catch(() => ({}));
            }
            return promise;
        };
    })();

    /* 3d1. Caruselul de pe landing: fotografiile din colectia "Hero" (gestionata
       din admin) se rotesc pe tot ecranul, cate una la ~5 secunde. Colectia
       "Hero" nu apare public in pagina de Colectii — e doar sursa caruselului.
       Daca e goala, ramane fotografia clasica hero.webp. */
    const loadHeroCarousel = async () => {
        const wrap = document.getElementById('heroCarousel');
        if (!wrap) return;

        const manifest = await fetchManifest();
        const heroGallery = (manifest.galleries || []).find(g => g.name === 'Hero');
        const files = (heroGallery && heroGallery.photos && heroGallery.photos.length)
            ? heroGallery.photos.map(f => `./assets/${f}`)
            : ['./assets/hero.webp'];

        const slides = files.map((src, i) => {
            const slide = document.createElement('div');
            slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.loading = i === 0 ? 'eager' : 'lazy';
            if (i === 0) img.fetchPriority = 'high';
            slide.appendChild(img);
            wrap.appendChild(slide);
            return slide;
        });

        // Cu reduced-motion activat sau o singura fotografie, nu rotim
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (slides.length < 2 || reduced) return;

        let current = 0;
        setInterval(() => {
            const next = (current + 1) % slides.length;
            slides[current].classList.remove('active');
            slides[next].classList.add('active');
            current = next;
        }, 5000);
    };
    loadHeroCarousel();

    /* 3d2. Fasia de coperti din banda "Colectii" — pana la 4 coperti de colectii
       reale, ca fundal. Colectia interna "Hero" si cele goale sunt excluse. */
    const loadBandPhotos = async () => {
        const strip = document.getElementById('bandPhotos');
        if (!strip) return;

        const manifest = await fetchManifest();
        const covers = (manifest.galleries || [])
            .filter(g => g.name !== 'Hero' && g.cover && g.photos && g.photos.length)
            .slice(0, 4)
            .map(g => g.cover);

        if (!covers.length) return; // fara coperti lasam fundalul simplu

        // Numarul de coloane il decide CSS-ul (grid-auto-flow: column), ca sa
        // poata fi schimbat din media query pe telefon — un stil inline aici
        // ar bate regula de mobil.
        strip.innerHTML = '';
        covers.forEach(file => {
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.decoding = 'async';
            img.alt = '';
            img.src = `./assets/${file.replace(/\.webp$/, '_sm.webp')}`;
            strip.appendChild(img);
        });
    };
    loadBandPhotos();

    /* 3d. Placile de categorie de pe landing — fiecare duce in portofoliu,
       direct pe categoria ei (portfolio.html?cat=...). */
    const loadCategoryTiles = async () => {
        const grid = document.getElementById('categoryGrid');
        if (!grid) return;

        const manifest = await fetchManifest();
        if (!manifest.sections) return;

        const sections = manifest.sections || [];
        const photos = manifest.photos || [];

        const render = () => {
            grid.innerHTML = '';
            sections.forEach((section, i) => {
                const inSection = photos.filter(p => p.section === section);
                if (!inSection.length) return; // fara fotografii nu desenam placa

                // Thumbnail-ul ales din admin (steluta); daca nu e setat sau nu mai
                // e valabil, cadem pe prima poza din sectiune, ca pana acum.
                const chosen = (manifest.section_covers || {})[section];
                const cover = inSection.find(p => p.file === chosen) || inSection[0];
                const label = window.SiteI18n ? window.SiteI18n.dataName(section) : section;
                const word = window.SiteI18n
                    ? window.SiteI18n.t(inSection.length === 1 ? 'collections.count.one' : 'collections.count.many')
                    : (inSection.length === 1 ? 'fotografie' : 'fotografii');

                const tile = document.createElement('a');
                tile.className = 'category-tile fade-in' + (i === 1 ? ' delay-1' : i > 1 ? ' delay-2' : '');
                tile.href = `portfolio.html?cat=${encodeURIComponent(section)}`;
                tile.dataset.section = section;

                const img = document.createElement('img');
                img.loading = i < 2 ? 'eager' : 'lazy';
                img.src = `./assets/${cover.file}`;
                img.srcset = `./assets/${cover.file.replace(/\.webp$/, '_sm.webp')} 1000w, ./assets/${cover.file} 2000w`;
                img.sizes = '(max-width: 900px) 100vw, 50vw';
                img.alt = label;
                tile.appendChild(img);

                const scrim = document.createElement('div');
                scrim.className = 'category-tile-scrim';
                tile.appendChild(scrim);

                const labelBox = document.createElement('div');
                labelBox.className = 'category-tile-label';
                const name = document.createElement('h2');
                name.className = 'category-tile-name';
                name.textContent = label;
                const count = document.createElement('div');
                count.className = 'category-tile-count';
                count.textContent = `${inSection.length} ${word}`;
                // contorul mic deasupra, numele mare dedesubt
                labelBox.appendChild(count);
                labelBox.appendChild(name);
                tile.appendChild(labelBox);

                grid.appendChild(tile);
                if (window.observer) window.observer.observe(tile);
            });
        };

        render();
        document.addEventListener('sitelanguagechange', render);
    };
    loadCategoryTiles();

    /* 4. Manifest-driven Gallery (sections/tabs) & Lightbox */
    let galleryImages = []; // Store the paths currently shown, for the lightbox
    const loadGallery = async () => {
        const container = document.getElementById('auto-gallery');
        const tabsContainer = document.getElementById('portfolio-tabs');
        if (!container) return;

        let manifest = { sections: [], photos: [] };
        try {
            const res = await fetch(`./assets/manifest.json?v=${Date.now()}`);
            if (res.ok) manifest = await res.json();
        } catch (e) {
            console.warn('Could not load gallery manifest:', e);
        }

        const sections = manifest.sections || [];
        const photos = manifest.photos || [];
        // Photos filed only into a Collection (no section) live there exclusively —
        // they don't spill into the main flowing portfolio unless also given a section.
        const filesInGalleries = new Set((manifest.galleries || []).flatMap(g => g.photos));
        // Deep link din landing: portfolio.html?cat=Portrete preselecteaza categoria
        const wantedCat = new URLSearchParams(window.location.search).get('cat');
        let activeFilter = (wantedCat && sections.includes(wantedCat)) ? wantedCat : 'All';

        const renderGrid = () => {
            container.innerHTML = '';
            galleryImages = [];
            const filtered = activeFilter === 'All'
                ? photos.filter(p => !(!p.section && filesInGalleries.has(p.file)))
                : photos.filter(p => p.section === activeFilter);

            filtered.forEach((p, i) => {
                const largeSrc = `./assets/${p.file}`;
                const smallSrc = `./assets/${p.file.replace(/\.webp$/, '_sm.webp')}`;
                galleryImages.push(largeSrc);

                const item = document.createElement('div');
                item.className = 'gallery-item fade-in hover-zoom';
                item.dataset.index = i;

                const speed = (i % 2 === 0) ? "0.06" : "-0.04";
                const wrapper = document.createElement('div');
                wrapper.className = 'image-wrapper parallax-img';
                wrapper.dataset.speed = speed;
                if (p.w && p.h) wrapper.style.aspectRatio = `${p.w} / ${p.h}`;

                const img = document.createElement('img');
                img.loading = 'lazy';
                img.src = largeSrc;
                img.srcset = `${smallSrc} 1000w, ${largeSrc} 2000w`;
                img.sizes = '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, (max-width: 1600px) 33vw, 25vw';
                img.alt = p.alt || (window.SiteI18n ? window.SiteI18n.t('portfolio.photo.alt') : 'Fotografie de Anița Șerban');
                wrapper.appendChild(img);
                item.appendChild(wrapper);

                item.addEventListener('click', () => openLightbox(item.dataset.index));

                container.appendChild(item);
                window.observer.observe(item);
            });
        };

        // Eticheta afisata pentru un tab: 'All' se traduce, restul sunt nume din
        // manifest (date romanesti) traduse doar la afisare.
        const tabLabel = (t) => {
            if (!window.SiteI18n) return t === 'All' ? 'Toate' : t;
            return t === 'All' ? window.SiteI18n.t('portfolio.tab.all') : window.SiteI18n.dataName(t);
        };

        if (sections.length && tabsContainer) {
            const tabs = ['All', ...sections];
            tabsContainer.innerHTML = '';
            tabs.forEach(t => {
                const btn = document.createElement('button');
                btn.className = 'portfolio-tab' + (t === activeFilter ? ' active' : '');
                btn.dataset.filter = t;
                // 'All' ramane cheia interna de filtrare; eticheta afisata depinde de limba
                btn.textContent = tabLabel(t);
                btn.addEventListener('click', () => {
                    tabsContainer.querySelectorAll('.portfolio-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeFilter = t;
                    renderGrid();
                });
                tabsContainer.appendChild(btn);
            });
        }

        renderGrid();

        // La schimbarea limbii: re-etichetam tab-urile si re-randam grila
        // (alt-textul imaginilor depinde si el de limba).
        document.addEventListener('sitelanguagechange', () => {
            if (tabsContainer) {
                tabsContainer.querySelectorAll('.portfolio-tab').forEach(b => {
                    b.textContent = tabLabel(b.dataset.filter);
                });
            }
            renderGrid();
        });
    };
    loadGallery();

    /* Lightbox Engine */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const bgClose = document.getElementById('lightbox-close');
    const lbPrev = document.getElementById('lightbox-prev');
    const lbNext = document.getElementById('lightbox-next');
    let currentLightboxIndex = 0;

    const openLightbox = (index) => {
        currentLightboxIndex = parseInt(index);
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    };

    const updateLightboxImage = () => {
        if (currentLightboxIndex < 0) currentLightboxIndex = galleryImages.length - 1;
        if (currentLightboxIndex >= galleryImages.length) currentLightboxIndex = 0;
        lightboxImg.src = galleryImages[currentLightboxIndex];
    };

    // Small public hook so other pages (e.g. collections.html) can reuse this same
    // lightbox for a different set of images without duplicating the whole engine.
    window.SerbanLightbox = {
        open: (images, index) => {
            galleryImages = images;
            openLightbox(index);
        }
    };

    if (bgClose) bgClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', () => { currentLightboxIndex--; updateLightboxImage(); });
    if (lbNext) lbNext.addEventListener('click', () => { currentLightboxIndex++; updateLightboxImage(); });

    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') { currentLightboxIndex--; updateLightboxImage(); }
        else if (e.key === 'ArrowRight') { currentLightboxIndex++; updateLightboxImage(); }
    });

    let touchStartX = 0;
    let touchEndX = 0;

    const handleSwipe = () => {
        const swipeDist = touchStartX - touchEndX;
        if (swipeDist > 50) {
            // Swipe Left -> Next
            currentLightboxIndex++;
            updateLightboxImage();
        } else if (swipeDist < -50) {
            // Swipe Right -> Prev
            currentLightboxIndex--;
            updateLightboxImage();
        }
    };

    if (lightbox) {
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        lightbox.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    /* 5. Helpers */
    const txt = document.getElementById('message');
    if (txt) txt.addEventListener('input', function () {
        this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';
    });
});