document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const galleryName = params.get('g');

    const indexView = document.getElementById('collectionsIndexView');
    const detailView = document.getElementById('collectionDetailView');

    let manifest = { galleries: [], photos: [] };
    try {
        const res = await fetch(`./assets/manifest.json?v=${Date.now()}`);
        if (res.ok) manifest = await res.json();
    } catch (e) {
        console.warn('Could not load collections manifest:', e);
    }

    const photoLookup = new Map((manifest.photos || []).map(p => [p.file, p]));
    // Only collections with at least one photo (and therefore a cover) are worth a tile.
    const galleries = (manifest.galleries || []).filter(g => g.cover && g.photos.length);

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
            empty.textContent = 'Nothing here yet — check back soon.';
            list.appendChild(empty);
            return;
        }

        galleries.forEach(g => {
            const tile = document.createElement('a');
            tile.className = 'collection-tile fade-in';
            tile.href = `collections.html?g=${encodeURIComponent(g.name)}`;

            const img = document.createElement('img');
            img.src = `./assets/${g.cover}`;
            img.loading = 'lazy';
            img.alt = g.name;
            tile.appendChild(img);

            const scrim = document.createElement('div');
            scrim.className = 'collection-tile-scrim';
            tile.appendChild(scrim);

            const label = document.createElement('div');
            label.className = 'collection-tile-label';
            const name = document.createElement('h3');
            name.className = 'collection-tile-name';
            name.textContent = g.name;
            const count = document.createElement('div');
            count.className = 'collection-tile-count';
            count.textContent = `${g.photos.length} photo${g.photos.length === 1 ? '' : 's'}`;
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
            title.textContent = 'Collection not found';
            document.title = 'Collection not found | Anița Șerban Photography';
            return;
        }

        title.textContent = gallery.name;
        document.title = `${gallery.name} | Anița Șerban Photography`;

        const images = gallery.photos.map(file => `./assets/${file}`);

        gallery.photos.forEach((file, i) => {
            const photoData = photoLookup.get(file) || {};
            const largeSrc = `./assets/${file}`;
            const smallSrc = `./assets/${file.replace(/\.webp$/, '_sm.webp')}`;

            const item = document.createElement('div');
            item.className = 'gallery-item fade-in hover-zoom';

            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            if (photoData.w && photoData.h) wrapper.style.aspectRatio = `${photoData.w} / ${photoData.h}`;

            const img = document.createElement('img');
            img.loading = 'lazy';
            img.src = largeSrc;
            img.srcset = `${smallSrc} 1000w, ${largeSrc} 2000w`;
            img.sizes = '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, (max-width: 1600px) 33vw, 25vw';
            img.alt = photoData.alt || gallery.name;
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
