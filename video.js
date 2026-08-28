/* Pagina Video — index (lista de proiecte) + detaliu (?p=slug).
   Acelasi tipar ca la collections.js: un singur fisier HTML cu doua sectiuni,
   comutate din parametrul din URL, totul citit din manifest.json. */
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const wantedSlug = params.get('p');

    const indexView = document.getElementById('videoIndexView');
    const detailView = document.getElementById('videoDetailView');

    const T = (key) => (window.SiteI18n ? window.SiteI18n.t(key) : key);
    const DISPLAY = (name) => (window.SiteI18n ? window.SiteI18n.dataName(name) : name);
    const LANG = () => (window.SiteI18n ? window.SiteI18n.lang : 'ro');

    /* Textele lungi (poveste, scenariu, legende) stau in manifest cu ambele
       limbi alaturi — dictionarul din i18n.js e doar pentru sirurile de interfata. */
    const L = (field) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[LANG()] || field.ro || field.en || '';
    };

    /* Rolurile stau in manifest ca etichete ("Filmare", "Color"). Pe pagina
       proiectului le scriem ca propozitie, deci avem nevoie de forma din
       mijlocul frazei — "Color" nu devine "color", ci "colorizare". */
    const ROLE_WORDS = {
        ro: {
            'Regie': 'regie', 'Filmare': 'filmare', 'Montaj': 'montaj',
            'Color': 'colorizare', 'Sunet': 'sunet', 'Dronă': 'filmare cu drona',
            'Tehnic': 'partea tehnică'
        },
        en: {
            'Regie': 'directing', 'Filmare': 'cinematography', 'Montaj': 'editing',
            'Color': 'color grading', 'Sunet': 'sound', 'Dronă': 'drone work',
            'Tehnic': 'the technical side'
        }
    };
    const CREDIT_NAME = 'Anița Șerban';

    /* "Filmare, montaj și colorizare — Anița Șerban" */
    function creditLine(roles) {
        const lang = LANG();
        const words = (roles || [])
            .map(r => (ROLE_WORDS[lang] || ROLE_WORDS.ro)[r] || DISPLAY(r).toLowerCase())
            .filter(Boolean);
        if (!words.length) return '';
        const and = lang === 'en' ? ' and ' : ' și ';
        const list = words.length === 1
            ? words[0]
            : words.slice(0, -1).join(', ') + and + words[words.length - 1];
        return list.charAt(0).toUpperCase() + list.slice(1) + ' — ' + CREDIT_NAME;
    }

    /* Utilizatorii care au cerut mai putina miscare primesc doar postere:
       nicio bucla nu porneste singura. */
    const REDUCED_MOTION = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let manifest = { videoProjects: [], videoReel: null };
    try {
        // Acelasi interval de 5 minute ca in script.js / collections.js.
        const cacheBucket = Math.floor(Date.now() / 300000);
        const res = await fetch(`/assets/manifest.json?v=${cacheBucket}`);
        if (res.ok) manifest = await res.json();
    } catch (e) {
        console.warn('Could not load video manifest:', e);
    }

    // Un proiect fara cover n-are cu ce sa se arate in lista.
    const projects = (manifest.videoProjects || []).filter(p => p.slug && p.cover);

    /* ---- Redarea buclelor: doar ce e pe ecran ruleaza ------------------- */
    /* Un singur observator pentru toate clipurile din pagina. Ce iese din
       ecran se pune pe pauza — altfel zece bucle 1080p ruleaza in acelasi
       timp si pagina incepe sa sacadeze pe telefon. */
    const playWhenVisible = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const v = entry.target;
            if (entry.isIntersecting) {
                if (!REDUCED_MOTION && v.dataset.autoplay === 'true') {
                    // play() da o promisiune respinsa daca browserul refuza
                    // pornirea automata; posterul ramane afisat, deci e ok.
                    v.play().catch(() => { });
                }
            } else {
                v.pause();
            }
        });
    }, { rootMargin: '100px', threshold: 0.25 });

    /* Sursa se pune abia cand clipul e aproape de ecran: fara asta, browserul
       incepe sa traga toate fisierele odata cu pagina. */
    const lazyVideoSrc = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const v = entry.target;
            if (v.dataset.src && !v.src) {
                v.src = v.dataset.src;
                v.load();
            }
            obs.unobserve(v);
        });
    }, { rootMargin: '300px' });

    const makeVideo = (file, poster, { autoplay = true, controls = false } = {}) => {
        const v = document.createElement('video');
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.preload = 'none';
        v.controls = controls;
        if (poster) v.poster = `/assets/${poster}`;
        v.dataset.src = `/assets/${file}`;
        v.dataset.autoplay = String(autoplay && !REDUCED_MOTION);
        lazyVideoSrc.observe(v);
        if (autoplay) playWhenVisible.observe(v);
        return v;
    };

    /* ---- Reel-ul din capul paginii ------------------------------------- */
    let reelReady = false;
    function renderReel() {
        if (reelReady) return;
        const reel = manifest.videoReel;
        const stage = document.getElementById('reelStage');
        const video = document.getElementById('reelVideo');
        const soundBtn = document.getElementById('reelSound');
        if (!stage || !video || !reel || !reel.file) return;

        reelReady = true;
        stage.hidden = false;
        if (reel.poster) video.poster = `/assets/${reel.poster}`;
        video.dataset.src = `/assets/${reel.file}`;
        video.dataset.autoplay = String(!REDUCED_MOTION);
        lazyVideoSrc.observe(video);
        playWhenVisible.observe(video);

        soundBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            soundBtn.setAttribute('aria-pressed', String(!video.muted));
            stage.classList.toggle('sound-on', !video.muted);
            // Daca sunetul e pornit dintr-un clic, avem voie sa si pornim redarea.
            if (!video.muted) video.play().catch(() => { });
        });
    }

    /* ---- Index: lista de proiecte -------------------------------------- */
    let activeFilter = 'All';

    function renderTabs() {
        const container = document.getElementById('video-tabs');
        if (!container) return;
        const kinds = [...new Set(projects.map(p => p.kind).filter(Boolean))];
        if (!kinds.length) { container.innerHTML = ''; return; }

        const tabs = ['All', ...kinds];
        container.innerHTML = '';
        tabs.forEach(kind => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'portfolio-tab' + (kind === activeFilter ? ' active' : '');
            btn.textContent = kind === 'All' ? T('video.tab.all') : DISPLAY(kind);
            btn.addEventListener('click', () => {
                activeFilter = kind;
                container.querySelectorAll('.portfolio-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderList();
            });
            container.appendChild(btn);
        });
    }

    function renderList() {
        const list = document.getElementById('videoList');
        if (!list) return;
        list.innerHTML = '';

        const shown = activeFilter === 'All'
            ? projects
            : projects.filter(p => p.kind === activeFilter);

        if (!shown.length) {
            const empty = document.createElement('p');
            empty.className = 'collections-empty';
            empty.textContent = T('video.empty');
            list.appendChild(empty);
            return;
        }

        shown.forEach(p => {
            const card = document.createElement('a');
            card.className = 'video-card fade-in';
            card.href = `video.html?p=${encodeURIComponent(p.slug)}`;

            const frame = document.createElement('div');
            frame.className = 'video-card-frame';

            const img = document.createElement('img');
            img.className = 'video-card-poster';
            img.src = `/assets/${p.cover}`;
            img.loading = 'lazy';
            img.alt = DISPLAY(p.name);
            frame.appendChild(img);

            /* Bucla scurta sta peste poster si se stinge in el. Pe desktop
               porneste la hover; pe telefon (unde hover nu exista) o pornim
               cand cardul intra pe ecran. */
            if (p.loop && !REDUCED_MOTION) {
                const loop = makeVideo(p.loop, null, { autoplay: false });
                loop.className = 'video-card-loop';
                frame.appendChild(loop);

                const canHover = window.matchMedia('(hover: hover)').matches;
                if (canHover) {
                    card.addEventListener('mouseenter', () => {
                        if (!loop.src && loop.dataset.src) loop.src = loop.dataset.src;
                        loop.play().catch(() => { });
                        frame.classList.add('playing');
                    });
                    card.addEventListener('mouseleave', () => {
                        loop.pause();
                        frame.classList.remove('playing');
                    });
                } else {
                    loop.dataset.autoplay = 'true';
                    playWhenVisible.observe(loop);
                    frame.classList.add('playing');
                }
            }

            const scrim = document.createElement('div');
            scrim.className = 'video-card-scrim';
            frame.appendChild(scrim);

            const label = document.createElement('div');
            label.className = 'video-card-label';

            const name = document.createElement('h3');
            name.className = 'video-card-name';
            name.textContent = DISPLAY(p.name);
            label.appendChild(name);

            const sub = document.createElement('div');
            sub.className = 'video-card-sub';
            sub.textContent = [p.location, p.year].filter(Boolean).join(' · ');
            label.appendChild(sub);

            frame.appendChild(label);
            card.appendChild(frame);
            list.appendChild(card);
            if (window.observer) window.observer.observe(card);
        });
    }

    /* ---- Detaliu: un proiect ------------------------------------------- */
    /* ---------------------------------------------------------------
       SEO pentru vizualizarea de proiect.
       Proiectele traiesc pe video.html?p=<slug> si sunt in sitemap, dar
       canonical-ul din HTML arata mereu spre video.html — adica ii spunea
       lui Google sa NU indexeze paginile de proiect. Le rescriem la runtime,
       impreuna cu og: si cu un VideoObject construit din manifest.
       --------------------------------------------------------------- */
    const SITE = 'https://serban-photo.com';
    // Pagina exista in doua limbi: /video.html si /en/video.html. URL-urile
    // canonice trebuie sa ramana in limba paginii curente, altfel varianta
    // engleza s-ar canonicaliza spre cea romaneasca si ar iesi din index.
    const LANG_BASE = /^\/en(\/|$)/.test(location.pathname) ? '/en' : '';
    const pageUrl = (query) => `${SITE}${LANG_BASE}/video.html${query || ''}`;

    function setMeta(selector, attr, value) {
        const el = document.querySelector(selector);
        if (el) el.setAttribute(attr, value);
    }

    function setCanonical(url) {
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'canonical';
            document.head.appendChild(link);
        }
        link.href = url;
        setMeta('meta[property="og:url"]', 'content', url);

        // Perechea hreflang trebuie sa urmeze acelasi ?p=, nu doar /video.html
        const query = url.slice(url.indexOf('/video.html') + '/video.html'.length);
        const pairs = { ro: `${SITE}/video.html${query}`, en: `${SITE}/en/video.html${query}` };
        document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (el) {
            const hl = el.getAttribute('hreflang');
            if (hl === 'ro' || hl === 'x-default') el.href = pairs.ro;
            else if (hl === 'en') el.href = pairs.en;
        });
    }

    function setVideoSchema(project) {
        const old = document.getElementById('videoSchema');
        if (old) old.remove();
        if (!project) return;

        const url = pageUrl(`?p=${project.slug}`);
        const poster = (project.hero && project.hero.poster) || project.cover;
        const intro = project.intro && (project.intro[LANG()] || project.intro.ro);

        const node = {
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: DISPLAY(project.name),
            url: url,
            inLanguage: LANG() === 'en' ? 'en' : 'ro-RO',
            creator: { '@id': `${SITE}/#anita` },
            publisher: { '@id': `${SITE}/#business` }
        };
        if (intro) node.description = intro;
        if (poster) node.thumbnailUrl = `${SITE}/assets/${poster}`;
        if (project.year) node.uploadDate = `${project.year}-01-01`;
        if (project.location) node.contentLocation = { '@type': 'Place', name: project.location };
        if (project.youtube) node.embedUrl = `https://www.youtube.com/embed/${project.youtube}`;
        else if (project.hero && project.hero.file) node.contentUrl = `${SITE}/assets/${project.hero.file}`;

        const tag = document.createElement('script');
        tag.type = 'application/ld+json';
        tag.id = 'videoSchema';
        tag.textContent = JSON.stringify(node);
        document.head.appendChild(tag);
    }

    function renderDetail(project) {
        const title = document.getElementById('videoTitle');
        const meta = document.getElementById('videoMeta');
        const body = document.getElementById('videoDetail');
        const lead = document.getElementById('videoLead');
        const leadMedia = document.getElementById('videoLeadMedia');
        const leadMeta = document.getElementById('videoLeadMeta');
        body.innerHTML = '';
        meta.innerHTML = '';
        leadMedia.innerHTML = '';
        leadMeta.textContent = '';
        lead.classList.remove('is-empty');
        lead.hidden = false;

        /* Bara de navigatie e transparenta sus si sta direct peste clip. Fara
           .over-hero pe <body>, textul si pictogramele raman in culorile temei
           si dispar in imagine — exact ca pe prima pagina, care foloseste
           aceeasi clasa. */
        document.body.classList.toggle('over-hero', !!(project && (project.hero || project.cover)));

        if (!project) {
            // Fara proiect nu avem clip: antetul ramane doar cu titlul, pe fundal.
            lead.classList.add('is-empty');
            title.textContent = T('video.notfound');
            document.title = `${T('video.notfound')} | Anița Șerban Photography`;
            setVideoSchema(null);
            let robots = document.querySelector('meta[name="robots"]');
            if (!robots) {
                robots = document.createElement('meta');
                robots.name = 'robots';
                document.head.appendChild(robots);
            }
            robots.content = 'noindex, follow';
            return;
        }

        title.textContent = DISPLAY(project.name);
        document.title = `${DISPLAY(project.name)} | Anița Șerban Photography`;
        setCanonical(pageUrl(`?p=${project.slug}`));
        setMeta('meta[property="og:title"]', 'content', `${DISPLAY(project.name)} | Anița Șerban Photography`);
        const ogImg = (project.hero && project.hero.poster) || project.cover;
        if (ogImg) setMeta('meta[property="og:image"]', 'content', `${SITE}/assets/${ogImg}`);
        setVideoSchema(project);

        // Peste clip, deasupra titlului: ce fel de proiect, unde si cand.
        leadMeta.textContent = [DISPLAY(project.kind), project.location, project.year]
            .filter(Boolean).join(' · ');

        // Sub clip: ce am facut la film, scris ca propozitie, cu numele la capat.
        const credit = creditLine(project.role);
        if (credit) {
            const line = document.createElement('p');
            line.className = 'video-credit';
            line.textContent = credit;
            meta.appendChild(line);
        }

        // Cadrele din proiect alimenteaza acelasi lightbox ca in restul site-ului.
        const stillsForLightbox = [];
        (project.blocks || []).forEach(b => {
            if (b.type === 'stills') (b.files || []).forEach(f => stillsForLightbox.push(`/assets/${f}`));
        });

        /* Clipul de deschidere umple antetul. Trece prin acelasi observator
           ca restul clipurilor, dar fiind in capul paginii porneste imediat. */
        if (project.hero) {
            leadMedia.appendChild(makeVideo(project.hero.file, project.hero.poster));
        } else if (project.cover) {
            const img = document.createElement('img');
            img.src = `/assets/${project.cover}`;
            img.alt = '';
            leadMedia.appendChild(img);
        }

        // Paragraful de intrare — de ce exista filmul.
        if (project.intro) {
            const intro = document.createElement('p');
            intro.className = 'video-intro fade-in';
            intro.textContent = L(project.intro);
            body.appendChild(intro);
            if (window.observer) window.observer.observe(intro);
        }

        let stillIndex = 0;

        (project.blocks || []).forEach(block => {
            let el = null;

            if (block.type === 'text') {
                el = document.createElement('p');
                el.className = 'video-text';
                el.textContent = L(block.body);

            } else if (block.type === 'script') {
                el = document.createElement('div');
                el.className = 'video-script';
                const head = document.createElement('div');
                head.className = 'video-script-head';
                head.textContent = block.label ? L(block.label) : T('video.script');
                const pre = document.createElement('pre');
                pre.className = 'video-script-body';
                pre.textContent = L(block.body);
                el.appendChild(head);
                el.appendChild(pre);

            } else if (block.type === 'clip') {
                el = document.createElement('figure');
                el.className = 'video-clip';
                el.appendChild(makeVideo(block.file, block.poster));
                const caption = L(block.caption);
                if (caption) {
                    const cap = document.createElement('figcaption');
                    cap.textContent = caption;
                    el.appendChild(cap);
                }

            } else if (block.type === 'stills') {
                el = document.createElement('div');
                // Un singur cadru ocupa tot randul; doua stau alaturi.
                el.className = 'video-stills' + ((block.files || []).length === 1 ? ' single' : '');
                (block.files || []).forEach(file => {
                    const myIndex = stillIndex++;
                    const item = document.createElement('div');
                    item.className = 'video-still hover-zoom';
                    const img = document.createElement('img');
                    img.loading = 'lazy';
                    img.src = `/assets/${file}`;
                    img.srcset = `/assets/${file.replace(/\.webp$/, '_sm.webp')} 1000w, /assets/${file} 2000w`;
                    img.sizes = '(max-width: 700px) 100vw, 50vw';
                    img.alt = DISPLAY(project.name);
                    item.appendChild(img);
                    item.addEventListener('click', () => {
                        if (window.SerbanLightbox) window.SerbanLightbox.open(stillsForLightbox, myIndex);
                    });
                    el.appendChild(item);
                });
            }

            if (!el) return;
            el.classList.add('fade-in');
            body.appendChild(el);
            if (window.observer) window.observer.observe(el);
        });

        /* Filmul intreg, daca exista — incarcat abia la clic. Pana atunci
           YouTube nu ruleaza niciun script si nu pune niciun cookie, deci
           pagina ramane in acord cu nota de confidentialitate. */
        if (project.youtube) {
            const wrap = document.createElement('div');
            wrap.className = 'video-full fade-in';

            const head = document.createElement('div');
            head.className = 'video-full-head';
            head.textContent = T('video.full');
            wrap.appendChild(head);

            const facade = document.createElement('button');
            facade.type = 'button';
            facade.className = 'video-facade magnetic';
            facade.setAttribute('aria-label', T('video.full.play'));

            const thumb = document.createElement('img');
            thumb.loading = 'lazy';
            thumb.alt = '';
            thumb.src = project.youtubePoster
                ? `/assets/${project.youtubePoster}`
                : `https://i.ytimg.com/vi/${project.youtube}/maxresdefault.jpg`;
            facade.appendChild(thumb);

            const play = document.createElement('span');
            play.className = 'video-facade-play';
            play.setAttribute('aria-hidden', 'true');
            facade.appendChild(play);

            facade.addEventListener('click', () => {
                const iframe = document.createElement('iframe');
                // youtube-nocookie + autoplay: nimic nu se incarca inainte de clic.
                iframe.src = `https://www.youtube-nocookie.com/embed/${project.youtube}?autoplay=1&rel=0`;
                iframe.title = DISPLAY(project.name);
                iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                iframe.loading = 'lazy';
                facade.replaceWith(iframe);
            });

            wrap.appendChild(facade);
            body.appendChild(wrap);
            if (window.observer) window.observer.observe(wrap);
        }
    }

    /* ---- Comutarea intre vederi + reactia la schimbarea limbii ---------- */
    const current = () => projects.find(p => p.slug === wantedSlug);

    function render() {
        if (wantedSlug) {
            indexView.style.display = 'none';
            detailView.style.display = '';
            renderDetail(current());
        } else {
            indexView.style.display = '';
            detailView.style.display = 'none';
            setCanonical(pageUrl());
            setVideoSchema(null);
            renderReel();
            renderTabs();
            renderList();
        }
    }

    document.addEventListener('sitelanguagechange', render);
    render();
});
