document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const galleryName = params.get('g');

    const indexView = document.getElementById('collectionsIndexView');
    const detailView = document.getElementById('collectionDetailView');

    let lastGalleryCount = 0;
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const grid = document.getElementById('collectionGrid');
            if (grid) applyGalleryCols(grid, lastGalleryCount);
        }, 200);
    });

    let manifest = { galleries: [], photos: [] };
    try {
        // Bustam cache-ul o data la 5 minute, nu la fiecare incarcare — la fel
        // ca in script.js / fetchManifest.
        const cacheBucket = Math.floor(Date.now() / 300000);
        const res = await fetch(`/assets/manifest.json?v=${cacheBucket}`);
        if (res.ok) manifest = await res.json();
    } catch (e) {
        console.warn('Could not load collections manifest:', e);
    }

    const photoLookup = new Map((manifest.photos || []).map(p => [p.file, p]));
    // Only collections with at least one photo (and therefore a cover) are worth a tile.
    // "Hero" e colectia interna care alimenteaza caruselul de pe landing —
    // nu se afiseaza niciodata public.
    const galleries = (manifest.galleries || []).filter(g => g.name !== 'Hero' && g.cover && g.photos.length);

    // Scurtaturi i18n. Numele colectiilor raman in romana in date si in URL —
    // se traduc doar la afisare, ca linkurile existente sa nu se strice.
    const T = (key) => (window.SiteI18n ? window.SiteI18n.t(key) : key);
    const DISPLAY = (name) => (window.SiteI18n ? window.SiteI18n.dataName(name) : name);

    // Re-randam la schimbarea limbii
    document.addEventListener('sitelanguagechange', () => {
        if (galleryName) renderDetail(galleries.find(g => g.name === galleryName));
        else renderIndex();
    });

    if (galleryName) {
        indexView.style.display = 'none';
        detailView.style.display = '';
        renderDetail(galleries.find(g => g.name === galleryName));
    } else {
        indexView.style.display = '';
        detailView.style.display = 'none';
        renderIndex();
    }

    function renderIndex() {
        const list = document.getElementById('collectionsList');
        list.innerHTML = '';

        if (!galleries.length) {
            const empty = document.createElement('p');
            empty.className = 'collections-empty';
            empty.textContent = T('collections.empty');
            list.appendChild(empty);
            return;
        }

        galleries.forEach(g => {
            const tile = document.createElement('a');
            tile.className = 'collection-tile fade-in';
            tile.href = `collections.html?g=${encodeURIComponent(g.name)}`;

            const img = document.createElement('img');
            img.src = `/assets/${g.cover}`;
            img.loading = 'lazy';
            img.alt = DISPLAY(g.name);
            tile.appendChild(img);

            const scrim = document.createElement('div');
            scrim.className = 'collection-tile-scrim';
            tile.appendChild(scrim);

            const label = document.createElement('div');
            label.className = 'collection-tile-label';
            const name = document.createElement('h3');
            name.className = 'collection-tile-name';
            name.textContent = DISPLAY(g.name);
            const count = document.createElement('div');
            count.className = 'collection-tile-count';
            count.textContent = `${g.photos.length} ${T(g.photos.length === 1 ? 'collections.count.one' : 'collections.count.many')}`;
            label.appendChild(name);
            label.appendChild(count);
            tile.appendChild(label);

            list.appendChild(tile);
            if (window.observer) window.observer.observe(tile);
        });
    }

    function renderDetail(gallery) {
        const grid = document.getElementById('collectionGrid');
        const title = document.getElementById('collectionTitle');
        grid.innerHTML = '';

        if (!gallery) {
            title.textContent = T('collections.notfound');
            document.title = `${T('collections.notfound')} | Anița Șerban Photography`;
            return;
        }

        title.textContent = DISPLAY(gallery.name);
        document.title = `${DISPLAY(gallery.name)} | Anița Șerban Photography`;

        // Coloane explicite pentru orice galerie — vezi applyGalleryCols in script.js
        // (incarcat inaintea acestui fisier, deci functia e deja pe window).
        lastGalleryCount = gallery.photos.length;
        applyGalleryCols(grid, lastGalleryCount);

        const images = gallery.photos.map(file => `/assets/${file}`);

        gallery.photos.forEach((file, i) => {
            const photoData = photoLookup.get(file) || {};
            const largeSrc = `/assets/${file}`;
            const smallSrc = `/assets/${file.replace(/\.webp$/, '_sm.webp')}`;

            const item = document.createElement('div');
            item.className = 'gallery-item fade-in hover-zoom';

            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            if (photoData.w && photoData.h) wrapper.style.aspectRatio = `${photoData.w} / ${photoData.h}`;

            const img = document.createElement('img');
            img.loading = 'lazy';
            img.decoding = 'async';
            if (photoData.w && photoData.h) { img.width = photoData.w; img.height = photoData.h; }
            img.src = largeSrc;
            img.srcset = `${smallSrc} 1000w, ${largeSrc} 2000w`;
            img.sizes = '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, (max-width: 1600px) 33vw, 25vw';
            img.alt = photoData.alt || DISPLAY(gallery.name);
            wrapper.appendChild(img);
            item.appendChild(wrapper);

            item.addEventListener('click', () => {
                if (window.SerbanLightbox) window.SerbanLightbox.open(images, i);
            });

            grid.appendChild(item);
            if (window.observer) window.observer.observe(item);
        });
    }
});
