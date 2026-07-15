document.addEventListener('DOMContentLoaded', () => {
    /* 1. Cursor Logic */
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0, followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
    });

    const renderCursor = () => {
        cursorX += (mouseX - cursorX) * 0.5;
        cursorY += (mouseY - cursorY) * 0.5;
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
        requestAnimationFrame(renderCursor);
    };
    renderCursor();

    /* 2. Magnetic Elements */
    const magneticElements = document.querySelectorAll('a, .magnetic, button, .magnetic-btn');
    magneticElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('active');
            follower.classList.add('active');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('active');
            follower.classList.remove('active');
            el.style.transform = 'translate(0px, 0px)';
        });
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
    });

    /* 3. Scroll & Parallax */
    const nav = document.getElementById('main-navigation');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    window.observer = observer;
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });

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
        let activeFilter = 'All';

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
                img.alt = p.alt || 'Photo by Serban Anita';
                wrapper.appendChild(img);
                item.appendChild(wrapper);

                item.addEventListener('click', () => openLightbox(item.dataset.index));

                container.appendChild(item);
                window.observer.observe(item);
            });
        };

        if (sections.length && tabsContainer) {
            const tabs = ['All', ...sections];
            tabsContainer.innerHTML = '';
            tabs.forEach(t => {
                const btn = document.createElement('button');
                btn.className = 'portfolio-tab' + (t === 'All' ? ' active' : '');
                btn.textContent = t;
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