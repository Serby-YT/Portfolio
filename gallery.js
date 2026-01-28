async function loadGallery() {
    const container = document.getElementById("gallery");
    const hint = document.getElementById("galleryHint");

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const closeBtn = document.getElementById("closeBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!container) return;

    let photos = [];
    let currentIndex = -1;
    let preloadedImages = new Map(); // Cache for preloaded images

    // Preload next and previous images for instant navigation
    function preloadAdjacentImages(index) {
        if (index < 0 || index >= photos.length) return;
        
        const toPreload = [
            index - 1 >= 0 ? index - 1 : photos.length - 1,
            index + 1 < photos.length ? index + 1 : 0
        ];

        toPreload.forEach(i => {
            if (!preloadedImages.has(i)) {
                const img = new Image();
                img.src = photos[i].full;
                preloadedImages.set(i, img);
            }
        });
    }

    function openLightbox(index) {
        if (index < 0 || index >= photos.length) return;
        currentIndex = index;
        const p = photos[currentIndex];
        const src = p.full;
        const alt = p.alt || "";

        // Show loading state briefly if image not cached
        if (!preloadedImages.has(currentIndex)) {
            lightboxImg.classList.add('loading');
        }

        lightboxImg.src = src;
        lightboxImg.alt = alt;
        
        // Remove loading state when image loads
        lightboxImg.onload = () => {
            lightboxImg.classList.remove('loading');
        };

        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        // Preload adjacent images for faster navigation
        preloadAdjacentImages(currentIndex);
    }

    function closeLightbox() {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        lightboxImg.src = "";
        lightboxImg.classList.remove('loading');
        document.body.style.overflow = "";
        currentIndex = -1;
    }

    function showNext(e) {
        if (e) e.stopPropagation();
        if (currentIndex === -1) return;
        let nextIndex = currentIndex + 1;
        if (nextIndex >= photos.length) nextIndex = 0;
        openLightbox(nextIndex);
    }

    function showPrev(e) {
        if (e) e.stopPropagation();
        if (currentIndex === -1) return;
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = photos.length - 1;
        openLightbox(prevIndex);
    }

    // Bind handlers (only once)
    if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.dataset.bound = "1";
        closeBtn.addEventListener("click", closeLightbox);

        if (prevBtn) prevBtn.addEventListener("click", showPrev);
        if (nextBtn) nextBtn.addEventListener("click", showNext);

        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener("keydown", (e) => {
            if (!lightbox.classList.contains("open")) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") showNext();
            if (e.key === "ArrowLeft") showPrev();
        });
    }

    try {
        const res = await fetch(`/photos.json?v=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load photos.json (${res.status})`);

        photos = await res.json();

        if (!Array.isArray(photos) || photos.length === 0) {
            if (hint) hint.style.display = "";
            return;
        }

        if (hint) hint.style.display = "none";
        container.innerHTML = "";

        // Create gallery with progressive loading
        photos.forEach((p, index) => {
            const thumb = p.thumb || p.full;
            const alt = p.alt || "";

            const card = document.createElement("div");
            card.className = "card";
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.setAttribute("aria-label", `Deschide fotografia: ${alt}`);

            const img = new Image();
            img.alt = alt;
            
            // Progressive image loading with fade-in
            img.onload = () => {
                card.classList.add('loaded');
            };
            
            img.onerror = () => {
                card.classList.add('loaded'); // Still remove skeleton on error
                console.error(`Failed to load image: ${thumb}`);
            };

            // Use native lazy loading for better performance
            img.loading = "lazy";
            img.decoding = "async";
            img.src = thumb;

            card.appendChild(img);

            card.addEventListener("click", () => openLightbox(index));
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLightbox(index);
                }
            });

            container.appendChild(card);
        });

        // Preload first few full-size images for faster initial lightbox opening
        for (let i = 0; i < Math.min(3, photos.length); i++) {
            const img = new Image();
            img.src = photos[i].full;
            preloadedImages.set(i, img);
        }

    } catch (err) {
        console.error(err);
        if (hint) {
            hint.style.display = "";
            hint.textContent = "Galeria nu s-a încărcat. Verifică photos.json și căile fișierelor.";
        }
    }
}

document.addEventListener("DOMContentLoaded", loadGallery);
