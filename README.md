# serban-photo.com

Site static, servit direct de nginx din `/var/www/serban-photo` (git working tree,
branch `main`). Nu exista build pentru romana — fisierele din radacina se servesc
ca atare.

## Limbi

Romana traieste in radacina (`/portfolio.html`), engleza sub `/en/`
(`/en/portfolio.html`). Fiecare pereche e legata prin `hreflang` in `<head>` si
in `sitemap.xml`.

Limba se ia **din URL**, nu din browser si nu din localStorage. Detectia dupa
`navigator.languages` a fost scoasa: Googlebot randeaza cu locale en-US, deci
primea site-ul in engleza peste un HTML servit in romana.

### Paginile /en/ sunt generate

Nu edita nimic din `en/` — se suprascrie. Sursa e HTML-ul romanesc din radacina
plus tabelele de traduceri din `i18n.js`.

Dupa **orice** modificare la un `.html` din radacina sau la `i18n.js`:

```bash
node build_en.js
```

Scriptul cade cu eroare daca lipseste vreo cheie de traducere EN, deci nu poate
genera pagini pe jumatate traduse. `node` ruleaza doar local — pe server nu
exista, output-ul se comite ca orice alt fisier.

## Cache-busting

CSS/JS de la radacina primesc `Cache-Control: immutable` pe un an (vezi configul
nginx), deci **fiecare** modificare la `styles.css`, `script.js`, `i18n.js`,
`collections.js` sau `video.js` cere incrementat manual `?v=NN` in toate paginile
care il includ — inclusiv cele din `en/` (regenerate oricum de build_en.js).

## Deploy

```bash
git push origin main
ssh serbanserver 'cd /var/www/serban-photo && git pull --ff-only origin main'
```

Rollback: `git reset --hard <commit>` in docroot. Nu face niciodata `checkout` pe
alt branch in docroot-ul live.

## Ce nu e in git

`assets/` (poze, video, `manifest.json`) sunt gestionate pe server si ignorate de
git. O copie locala veche de `assets/` da 404-uri la testare locala — pe live
fisierele exista.
