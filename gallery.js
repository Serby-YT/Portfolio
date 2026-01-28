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

    function openLightbox(index) {
        if (index < 0 || index >= photos.length) return;
        currentIndex = index;
        const p = photos[currentIndex];
        const src = p.full;
        const alt = p.alt || "";

        lightboxImg.src = src;
        lightboxImg.alt = alt;
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        lightboxImg.src = "";
        document.body.style.overflow = "";
        currentIndex = -1;
    }

    function showNext(e) {
        if (e) e.stopPropagation();
        if (currentIndex === -1) return;
        let nextIndex = currentIndex + 1;
        if (nextIndex >= photos.length) nextIndex = 0; // Loop to first
        openLightbox(nextIndex);
    }

    function showPrev(e) {
        if (e) e.stopPropagation();
        if (currentIndex === -1) return;
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = photos.length - 1; // Loop to last
        openLightbox(prevIndex);
    }

    // Bind handlers
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

        photos.forEach((p, index) => {
            const thumb = p.thumb || p.full;
            const alt = p.alt || "";

            const card = document.createElement("div");
            card.className = "card";
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.setAttribute("aria-label", `Deschide fotografia: ${alt}`);

            const img = document.createElement("img");
            img.src = thumb;
            img.alt = alt;
            img.loading = "lazy";
            img.decoding = "async";

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
        console.error(err);
        if (hint) {
            hint.style.display = "";
            hint.textContent = "Galeria nu s-a încărcat. Verifică photos.json și căile fișierelor.";
        }
    }
}

document.addEventListener("DOMContentLoaded", loadGallery);
