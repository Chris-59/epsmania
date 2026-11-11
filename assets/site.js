// Filtre par theme de la page Ressources (ressources.html#numerique, etc.)
(function () {
  var chips = document.getElementById('chips');
  var liste = document.getElementById('liste');
  if (!chips || !liste) return;
  function appliquer(k) {
    var ok = false;
    Array.prototype.forEach.call(chips.querySelectorAll('.chip'), function (b) {
      var actif = b.getAttribute('data-k') === k;
      b.setAttribute('aria-pressed', actif ? 'true' : 'false');
      if (actif) ok = true;
    });
    if (!ok) return appliquer('tous');
    Array.prototype.forEach.call(liste.querySelectorAll('.card'), function (c) {
      c.hidden = !(k === 'tous' || c.getAttribute('data-theme') === k);
    });
  }
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    var k = b.getAttribute('data-k');
    history.replaceState(null, '', k === 'tous' ? location.pathname : '#' + k);
    appliquer(k);
  });
  function depuisAdresse() { appliquer((location.hash || '#tous').slice(1)); }
  window.addEventListener('hashchange', depuisAdresse);
  depuisAdresse();
})();

// Diaporamas : une image a la fois, fleches, defilement automatique, agrandissement au clic
(function () {
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visionneuse = null, vImg = null, vListe = [], vIndex = 0;
  function bouton(classe, texte, label) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = classe; b.textContent = texte; b.setAttribute('aria-label', label);
    return b;
  }
  function montrer(i) {
    vIndex = (i + vListe.length) % vListe.length;
    vImg.src = vListe[vIndex];
  }
  function ouvrir(liste, i) {
    if (!visionneuse) {
      visionneuse = document.createElement('div');
      visionneuse.className = 'visionneuse'; visionneuse.setAttribute('role', 'dialog'); visionneuse.setAttribute('aria-label', 'Image agrandie');
      vImg = document.createElement('img'); vImg.alt = '';
      var fermer = bouton('v-fermer', '×', 'Fermer');
      var prec = bouton('v-prec', '‹', 'Image précédente');
      var suiv = bouton('v-suiv', '›', 'Image suivante');
      visionneuse.appendChild(vImg); visionneuse.appendChild(prec); visionneuse.appendChild(suiv); visionneuse.appendChild(fermer);
      document.body.appendChild(visionneuse);
      prec.addEventListener('click', function (e) { e.stopPropagation(); montrer(vIndex - 1); });
      suiv.addEventListener('click', function (e) { e.stopPropagation(); montrer(vIndex + 1); });
      visionneuse.addEventListener('click', function () { visionneuse.classList.remove('on'); });
      document.addEventListener('keydown', function (e) {
        if (!visionneuse.classList.contains('on')) return;
        if (e.key === 'Escape') visionneuse.classList.remove('on');
        if (e.key === 'ArrowLeft') montrer(vIndex - 1);
        if (e.key === 'ArrowRight') montrer(vIndex + 1);
      });
    }
    vListe = liste; montrer(i);
    visionneuse.classList.toggle('seule', liste.length < 2);
    visionneuse.classList.add('on');
  }
  Array.prototype.forEach.call(document.querySelectorAll('.diapo'), function (d) {
    var slides = Array.prototype.slice.call(d.querySelectorAll('.slide'));
    var imgs = slides.map(function (s) { return s.querySelector('img'); });
    if (!slides.length) return;
    var sources = imgs.map(function (im) { return im.getAttribute('src'); });
    var i = 0, minuterie = null;
    d.classList.add('actif');
    imgs.forEach(function (im, n) {
      im.removeAttribute('loading');
      if (!im.closest('a')) im.addEventListener('click', function () { ouvrir(sources, n); });
    });
    var compte = document.createElement('span'); compte.className = 'd-compte';
    function aller(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      compte.textContent = (i + 1) + ' / ' + slides.length;
    }
    function lancer() { if (!calme && slides.length > 1 && !minuterie) minuterie = setInterval(function () { aller(i + 1); }, 5000); }
    function arreter() { clearInterval(minuterie); minuterie = null; }
    if (slides.length > 1) {
      var prec = bouton('d-prec', '‹', 'Image précédente');
      var suiv = bouton('d-suiv', '›', 'Image suivante');
      prec.addEventListener('click', function () { arreter(); aller(i - 1); });
      suiv.addEventListener('click', function () { arreter(); aller(i + 1); });
      d.appendChild(prec); d.appendChild(suiv); d.appendChild(compte);
      d.addEventListener('mouseenter', arreter); d.addEventListener('mouseleave', lancer);
    }
    aller(0); lancer();
  });
  // Les images seules s'agrandissent aussi au clic (sauf celles qui sont deja des liens)
  Array.prototype.forEach.call(document.querySelectorAll('.fig > img'), function (im) {
    im.classList.add('zoom');
    im.addEventListener('click', function () { ouvrir([im.getAttribute('src')], 0); });
  });
})();

// Plein ecran des applications sur telephone : si le navigateur ne sait pas le faire (iPhone), l'application s'ouvrait dans un onglet sans retour.
// On l'affiche a la place en plein ecran DANS la page, avec un bouton pour quitter.
(function () {
  var ouvrirNatif = window.open;
  function quitter() {
    var o = document.getElementById('pe-overlay'); if (o) o.parentNode.removeChild(o);
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', touche);
  }
  function touche(e) { if (e.key === 'Escape') quitter(); }
  window.open = function (url) {
    if (typeof url !== 'string' || url.indexOf('blob:') !== 0) return ouvrirNatif.apply(window, arguments);
    quitter();
    var o = document.createElement('div'); o.id = 'pe-overlay';
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#fff;display:flex;flex-direction:column;height:100vh;height:100dvh';
    var b = document.createElement('button'); b.type = 'button'; b.textContent = '\u2715 Quitter le plein \u00e9cran';
    b.style.cssText = 'flex:none;margin:0;padding:calc(12px + env(safe-area-inset-top)) 16px 12px;border:0;border-bottom:1px solid #c9d3df;background:#0f2b4f;color:#fff;font:600 16px/1.2 system-ui,sans-serif;text-align:center;cursor:pointer';
    b.addEventListener('click', quitter);
    var f = document.createElement('iframe'); f.src = url; f.title = 'Application en plein \u00e9cran';
    f.setAttribute('allow', 'microphone; fullscreen; clipboard-write; autoplay');
    f.style.cssText = 'flex:1 1 auto;width:100%;border:0;background:#fff';
    o.appendChild(b); o.appendChild(f); document.body.appendChild(o);
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', touche);
    return null;
  };
})();

// iPhone : Safari zoome dans tout champ de saisie dont le texte fait moins de 16 px et reste zoome ensuite.
// On force 16 px dans les applications integrees (documents blob de meme origine), en page normale comme en plein ecran.
(function () {
  var CSS = '@media (max-width: 820px) { input, select, textarea { font-size: 16px !important; } }';
  function corriger(f) {
    try {
      var d = f.contentDocument;
      if (!d || !d.head || d.getElementById('correctif-saisie')) return;
      var st = d.createElement('style'); st.id = 'correctif-saisie'; st.textContent = CSS; d.head.appendChild(st);
    } catch (e) {}
  }
  function suivre(f) {
    if (f.getAttribute('data-corrige')) return;
    var src = f.getAttribute('src') || '';
    if (src.indexOf('blob:') !== 0) return;
    f.setAttribute('data-corrige', '1');
    f.addEventListener('load', function () { corriger(f); });
    corriger(f);
  }
  function balayer() { Array.prototype.forEach.call(document.querySelectorAll('iframe'), suivre); }
  balayer();
  if (window.MutationObserver) new MutationObserver(balayer).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
})();

/* Bouton clair / sombre : memorise le choix du visiteur */
(function () {
  var cle = 'epsmania-theme', racine = document.documentElement;
  function actuel() { return racine.getAttribute('data-theme') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function appliquer(t) {
    racine.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#14161a' : '#ffffff');
    var b = document.querySelector('.theme-btn');
    if (b) { var lib = t === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'; b.setAttribute('aria-label', lib); b.setAttribute('title', lib); }
  }
  appliquer(actuel());
  var b = document.querySelector('.theme-btn');
  if (b) b.addEventListener('click', function () {
    var t = actuel() === 'dark' ? 'light' : 'dark';
    appliquer(t);
    try { localStorage.setItem(cle, t); } catch (e) {}
  });
})();
