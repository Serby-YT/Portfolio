// Stable gallery: thumbs in grid, full in lightbox, path + fallback handling
(function () {
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

  const normPath = (p) => {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    return p.startsWith("/") ? p : "/" + p;
  };

  const tryWebpVariant = (url) => url.replace(/\.(jpe?g)$/i, ".webp");

  function setLightboxSrc(index) {
    currentIndex = index;
    const full = normPath(photos[index]?.full || photos[index]?.thumb);
    lightboxImg.src = full;

    lightboxImg.onerror = () => {
      const webp = tryWebpVariant(full);
      if (webp !== full) {
        lightboxImg.onerror = null;
        lightboxImg.src = webp;
      }
    };
  }

  function openLightbox(index) {
    if (!photos.length) return;
    setLightboxSrc(index);
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
    lightboxImg.onerror = null;
    document.body.style.overflow = "";
    currentIndex = -1;
  }

  function showNext(e) {
    if (e) e.stopPropagation();
    if (currentIndex === -1 || !photos.length) return;
    setLightboxSrc((currentIndex + 1) % photos.length);
  }

  function showPrev(e) {
    if (e) e.stopPropagation();
    if (currentIndex === -1 || !photos.length) return;
    setLightboxSrc((currentIndex - 1 + photos.length) % photos.length);
  }

  closeBtn?.addEventListener("click", closeLightbox);
  prevBtn?.addEventListener("click", showPrev);
  nextBtn?.addEventListener("click", showNext);

  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });

  async function loadGallery() {
    try {
      const res = await fetch("/photos.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`photos.json HTTP ${res.status}`);
      photos = await res.json();

      if (!Array.isArray(photos) || photos.length === 0) {
        hint.textContent = "Nu s-au găsit fotografii.";
        return;
      }

      hint.style.display = "none";

      photos.forEach((photo, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");

        const img = document.createElement("img");

        const thumb = normPath(photo.thumb || photo.full);
        const full = normPath(photo.full || photo.thumb);

        img.src = thumb;
        img.alt = photo.title || "";
        img.loading = "lazy";
        img.decoding = "async";

        img.onerror = () => {
          const webpThumb = tryWebpVariant(thumb);
          if (webpThumb !== thumb) {
            img.onerror = () => {
              img.src = full;
              img.onerror = () => {
                const webpFull = tryWebpVariant(full);
                if (webpFull !== full) {
                  img.onerror = null;
                  img.src = webpFull;
                } else {
                  img.style.display = "none";
                }
              };
            };
            img.src = webpThumb;
            return;
          }
          img.src = full;
        };

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadGallery);
  } else {
    loadGallery();
  }
})();
