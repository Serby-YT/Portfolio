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

    /* 4. Dynamic Gallery Loader (Serban_X.webp) & Lightbox */
    let galleryImages = []; // Store the paths
    const loadGallery = () => {
        const container = document.querySelector('.gallery-grid');
        if (!container) return;

        let attemptCount = 1;
        const MAX_ATTEMPTS = 50; // Seteaza limita maxima pe care o acopera ca sa caute

        const tryNext = () => {
            if (attemptCount > MAX_ATTEMPTS) {
                console.log("Gallery Loaded successfully. Gaps skipped. Total images:", galleryImages.length);
                return;
            }

            const currentId = attemptCount;
            attemptCount++;

            const img = new Image();
            img.onload = () => {
                galleryImages.push(img.src);
                const item = document.createElement('div');
                item.className = 'gallery-item fade-in hover-zoom';
                item.dataset.index = galleryImages.length - 1;

                const speed = (galleryImages.length % 2 === 0) ? "0.06" : "-0.04";
                item.innerHTML = `
                    <div class="image-wrapper parallax-img" data-speed="${speed}">
                        <img src="${img.src}" alt="Gallery Image ${currentId}" loading="lazy">
                    </div>`;

                item.addEventListener('click', () => openLightbox(item.dataset.index));

                container.appendChild(item);
                window.observer.observe(item);
                
                tryNext(); // Continua sirul cu succes
            };
            img.onerror = () => {
                // Fisier lipsa gasit! Evitam blocajul pur si simplu chemand din nou functia pt numarul urmator.
                tryNext();
            };
            img.src = `./assets/Serban_${currentId}.webp?v=19`;
        }
        tryNext();
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