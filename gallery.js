// Ultra-simple, stable gallery - no glitches
(function() {
    let photos = [];
    let currentIndex = -1;

    const container = document.getElementById("gallery");
    const hint = document.getElementById("galleryHint");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const closeBtn = document.getElementById("closeBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!container) return;

    // Lightbox functions
    function openLightbox(index) {
        currentIndex = index;
        lightboxImg.src = photos[index].full;
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        lightbox.classList.remove("open");
        lightboxImg.src = "";
        document.body.style.overflow = "";
        currentIndex = -1;
    }

    function showNext(e) {
        if (e) e.stopPropagation();
        if (currentIndex === -1) return;
        currentIndex = (currentIndex + 1) % photos.length;
        lightboxImg.src = photos[currentIndex].full;
    }

    function showPrev(e) {
        if (e) e.stopPropagation();
        if (currentIndex === -1) return;
        currentIndex = (currentIndex - 1 + photos.length) % photos.length;
        lightboxImg.src = photos[currentIndex].full;
    }

    // Bind events
    closeBtn.addEventListener("click", closeLightbox);
    prevBtn.addEventListener("click", showPrev);
    nextBtn.addEventListener("click", showNext);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowRight") showNext();
        if (e.key === "ArrowLeft") showPrev();
    });

    // Load gallery
    async function loadGallery() {
        try {
            const res = await fetch("/photos.json");
            photos = await res.json();

            if (!photos || photos.length === 0) {
                hint.textContent = "Nu s-au găsit fotografii.";
                return;
            }

            hint.style.display = "none";

            // Create all cards at once - simple and stable
            photos.forEach((photo, index) => {
                const card = document.createElement("div");
                card.className = "card";
                card.setAttribute("role", "button");
                card.setAttribute("tabindex", "0");

                const img = document.createElement("img");
                img.src = photo.full; // Use full images directly - simpler
                img.alt = photo.title || "";
                img.loading = "lazy";

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

        } catch (err) {
            console.error("Gallery error:", err);
            hint.textContent = "Eroare la încărcarea galeriei.";
        }
    }

    // Start loading when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadGallery);
    } else {
        loadGallery();
    }
})();
