#!/usr/bin/env node
/* Genereaza varianta engleza a site-ului sub /en/.
 *
 * Sursa de adevar ramane HTML-ul in romana plus tabelele din i18n.js — aici
 * doar le combinam intr-un set de pagini reale. Engleza era pana acum doar un
 * comutator client-side, fara URL propriu, deci nu putea fi indexata niciodata.
 *
 * Ruleaza local (node nu exista pe server):  node build_en.js
 * Rezultatul din en/ se comite ca orice alt fisier.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'en');
const SITE = 'https://serban-photo.com';

const PAGES = [
    { file: 'index.html', ro: '/', en: '/en/', key: 'home' },
    { file: 'portfolio.html', ro: '/portfolio.html', en: '/en/portfolio.html', key: 'portfolio' },
    { file: 'collections.html', ro: '/collections.html', en: '/en/collections.html', key: 'collections' },
    { file: 'video.html', ro: '/video.html', en: '/en/video.html', key: 'video' },
    { file: 'privacy.html', ro: '/privacy.html', en: '/en/privacy.html', key: 'privacy' }
];

/* Citim tabelele rulind chiar i18n.js, ca sa nu tinem doua copii. */
function loadI18n() {
    const code = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
    const noop = function () { };
    const stub = {
        setAttribute: noop, getAttribute: () => null, removeAttribute: noop,
        classList: { toggle: noop, add: noop }, tagName: 'BUTTON',
        addEventListener: noop, appendChild: noop, querySelectorAll: () => []
    };
    const sandbox = {
        window: {},
        document: {
            documentElement: stub, head: stub, body: stub,
            addEventListener: noop, dispatchEvent: noop,
            querySelectorAll: () => [], querySelector: () => null,
            createElement: () => stub
        },
        location: { pathname: '/', search: '', hash: '' },
        localStorage: { getItem: () => null, setItem: noop },
        navigator: { languages: ['ro-RO'] },
        CustomEvent: function () { }
    };
    sandbox.window.document = sandbox.document;
    sandbox.window.location = sandbox.location;
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    const api = sandbox.window.SiteI18n;
    if (!api || !api.strings || !api.strings.en) throw new Error('nu am putut citi tabelele din i18n.js');
    return api.strings;
}

const STRINGS = loadI18n();
const EN = STRINGS.en;
const RO = STRINGS.ro;
const tr = (key) => (EN[key] != null ? EN[key] : (RO[key] != null ? RO[key] : null));

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const escKey = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function translateBody(html) {
    let missing = [];

    // Text: niciun element cu data-i18n nu contine alte taguri, deci [^<]* e sigur.
    html = html.replace(
        /(<([a-zA-Z0-9]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g,
        (m, open, tag, key, _old, close) => {
            const val = tr(key);
            if (val == null) { missing.push(key); return m; }
            return open + val + close;
        }
    );

    // Atribute traduse
    [['data-i18n-alt', 'alt'], ['data-i18n-placeholder', 'placeholder'],
     ['data-i18n-aria-label', 'aria-label'], ['data-i18n-title', 'title']].forEach(([dataAttr, realAttr]) => {
        const re = new RegExp('(<[a-zA-Z0-9]+\\b[^>]*\\b' + escKey(dataAttr) + '="([^"]+)"[^>]*>)', 'g');
        html = html.replace(re, (tagStr, _all, key) => {
            const val = tr(key);
            if (val == null) { missing.push(key); return tagStr; }
            const attrRe = new RegExp('\\b' + escKey(realAttr) + '="[^"]*"');
            return attrRe.test(tagStr)
                ? tagStr.replace(attrRe, realAttr + '="' + escAttr(val) + '"')
                : tagStr.replace(/>$/, ' ' + realAttr + '="' + escAttr(val) + '">');
        });
    });

    return { html, missing };
}

function rewriteLinks(html) {
    html = html.replace(/href="\/"/g, 'href="/en/"');
    ['portfolio', 'collections', 'video', 'privacy'].forEach(n => {
        html = html.replace(new RegExp('href="' + n + '\\.html"', 'g'), 'href="/en/' + n + '.html"');
    });
    html = html.replace(/href="index\.html(#[^"]*)"/g, 'href="/en/$1"');
    return html;
}

function rewriteJsonLd(html, page) {
    return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, open, body, close) => {
        let data;
        try { data = JSON.parse(body); } catch (e) { return m; }
        const enUrl = (v) => {
            const tail = v.slice(SITE.length);
            if (tail.startsWith('/en/') || tail.startsWith('/#')) return v;
            return SITE + (tail === '/' ? '/en/' : '/en' + tail);
        };
        // WebSite / Person / ProfessionalService sunt entitati la nivel de site,
        // aceleasi in ambele limbi: le pastram @id si url neatinse. Doar nodurile
        // de pagina si firimiturile primesc URL-ul englezesc.
        const GLOBAL = /^(WebSite|Person|Organization|ProfessionalService|LocalBusiness)$/;
        const walk = (node) => {
            if (Array.isArray(node)) return node.forEach(walk);
            if (!node || typeof node !== 'object') return;
            const isGlobal = typeof node['@type'] === 'string' && GLOBAL.test(node['@type']);
            for (const k of Object.keys(node)) {
                const v = node[k];
                if (typeof v === 'string') {
                    if (k === 'inLanguage') node[k] = 'en';
                    else if (!isGlobal && (k === 'url' || k === '@id' || k === 'item') && v.startsWith(SITE)) {
                        node[k] = enUrl(v);
                    }
                    else if (k === 'name' && v === 'Acasă') node[k] = 'Home';
                    else if (k === 'name' && v === 'Colecții') node[k] = 'Collections';
                    else if (k === 'name' && v === 'Portofoliu') node[k] = 'Portfolio';
                } else walk(v);
            }
        };
        walk(data);
        // titlul/descrierea paginii, in engleza
        const enTitle = tr('meta.title.' + page.key);
        const enDesc = tr('meta.description.' + page.key);
        const graph = data['@graph'] || [data];
        graph.forEach(n => {
            if (n['@type'] && /Gallery|CollectionPage|WebPage/.test(n['@type'])) {
                if (enTitle) n.name = enTitle;
                if (enDesc) n.description = enDesc;
            }
        });
        return open + '\n    ' + JSON.stringify(data, null, 4).replace(/\n/g, '\n    ') + '\n    ' + close;
    });
}

function buildPage(page) {
    const src = fs.readFileSync(path.join(ROOT, page.file), 'utf8');
    let html = src;
    const enTitle = tr('meta.title.' + page.key);
    const enDesc = tr('meta.description.' + page.key);
    if (!enTitle || !enDesc) throw new Error('lipsesc meta EN pentru ' + page.key);

    html = html.replace(/<html lang="ro"/, '<html lang="en"');
    html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + enTitle + '</title>');
    html = html.replace(/(<meta name="description"\s*\n?\s*content=")[^"]*(">)/, '$1' + escAttr(enDesc) + '$2');
    html = html.replace(/(<link rel="canonical" href=")[^"]*(">)/, '$1' + SITE + page.en + '$2');

    // Open Graph / Twitter, in engleza si spre URL-ul englezesc
    html = html.replace(/(<meta property="og:url" content=")[^"]*(">)/, '$1' + SITE + page.en + '$2');
    html = html.replace(/(<meta property="og:title" content=")[^"]*(">)/, '$1' + escAttr(enTitle) + '$2');
    html = html.replace(/(<meta property="og:description" content=")[^"]*(">)/, '$1' + escAttr(enDesc) + '$2');
    html = html.replace(/(<meta name="twitter:title" content=")[^"]*(">)/, '$1' + escAttr(enTitle) + '$2');
    html = html.replace(/(<meta name="twitter:description" content=")[^"]*(">)/, '$1' + escAttr(enDesc) + '$2');
    if (/og:locale/.test(html)) {
        html = html.replace(/(<meta property="og:locale" content=")[^"]*(">)/, '$1en$2');
    } else {
        html = html.replace(/(<meta property="og:url"[^>]*>)/, '$1\n    <meta property="og:locale" content="en">');
    }

    const t = translateBody(html);
    html = t.html;
    html = rewriteLinks(html);
    html = rewriteJsonLd(html, page);

    // privacy.html tine doua blocuri legale intregi in DOM; pe /en/ pornim din EN
    if (page.key === 'privacy') {
        html = html.replace('<div class="legal-lang active" data-lang="ro" lang="ro">',
                            '<div class="legal-lang" data-lang="ro" lang="ro">');
        html = html.replace('<div class="legal-lang" data-lang="en" lang="en">',
                            '<div class="legal-lang active" data-lang="en" lang="en">');
        // un singur H1 per pagina, in limba paginii
        html = html.replace('<h1>Politică de Confidențialitate</h1>', '<h2>Politică de Confidențialitate</h2>');
        html = html.replace('<h2>Privacy Policy</h2>', '<h1>Privacy Policy</h1>');
    }

    const banner = '<!-- Generat de build_en.js din ' + page.file + ' + i18n.js. Nu edita manual. -->\n';
    html = html.replace(/^<!DOCTYPE html>\n/i, '<!DOCTYPE html>\n' + banner);

    const outFile = path.join(OUT, page.file);
    fs.writeFileSync(outFile, html, 'utf8');
    return { page, missing: [...new Set(t.missing)], bytes: Buffer.byteLength(html) };
}

fs.mkdirSync(OUT, { recursive: true });
let allMissing = [];
for (const page of PAGES) {
    const r = buildPage(page);
    allMissing.push(...r.missing);
    console.log(`en/${r.page.file.padEnd(18)} ${String(r.bytes).padStart(6)} b` +
        (r.missing.length ? `  CHEI LIPSA: ${r.missing.join(', ')}` : ''));
}
allMissing = [...new Set(allMissing)];
if (allMissing.length) {
    console.error('\nChei fara traducere EN: ' + allMissing.join(', '));
    process.exit(1);
}
console.log('\nGata: ' + PAGES.length + ' pagini in /en/');
