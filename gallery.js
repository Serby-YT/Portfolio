async function loadGallery() {
  const container = document.getElementById("gallery");
  const hint = document.getElementById("galleryHint");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("closeBtn");

  if (!container) return;

  function openLightbox(src, alt = "") {
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
  }

  // Bind close handlers once
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = "1";

    closeBtn.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  try {
    const res = await fetch(`/photos.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load photos.json (${res.status})`);

    const photos = await res.json();

    if (!Array.isArray(photos) || photos.length === 0) {
      if (hint) hint.style.display = "";
      return;
    }

    if (hint) hint.style.display = "none";
    container.innerHTML = "";

    for (const p of photos) {
      const full = p.full;
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

      card.addEventListener("click", () => openLightbox(full, alt));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(full, alt);
        }
      });

      container.appendChild(card);
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
