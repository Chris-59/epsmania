/* Compteur de visites et messages des pages CRPE (Firebase Realtime Database, sans compte pour les visiteurs) */
(function () {
  var cfg = window.VIE || {};
  var zone = document.getElementById('vie');
  if (!zone || !cfg.databaseURL) return;
  var page = zone.getAttribute('data-page');
  function charger(src, fin) { var s = document.createElement('script'); s.src = src; s.onload = fin; s.onerror = function () {}; document.head.appendChild(s); }
  var base = 'https://www.gstatic.com/firebasejs/10.12.2/';
  charger(base + 'firebase-app-compat.js', function () {
    charger(base + 'firebase-database-compat.js', demarrer);
  });
  function demarrer() {
    var app = firebase.initializeApp({ databaseURL: cfg.databaseURL });
    var db = firebase.database(app);
    zone.hidden = false;

    // Compteur : une visite par navigateur et par session
    var compteur = { set textContent(n) { zone.querySelector('.vie-compteur strong').textContent = n; zone.querySelector('.vie-compteur .lib').textContent = (n === '0' || n === '1') ? 'visite' : 'visites'; } };
    var ref = db.ref('visites/' + page);
    var cle = 'vu-' + page;
    var deja = false; try { deja = sessionStorage.getItem(cle) === '1'; } catch (e) {}
    if (deja) {
      ref.once('value').then(function (s) { compteur.textContent = (s.val() || 0).toLocaleString('fr-FR'); });
    } else {
      ref.transaction(function (n) { return (n || 0) + 1; }).then(function (r) {
        compteur.textContent = (r.snapshot.val() || 0).toLocaleString('fr-FR');
        try { sessionStorage.setItem(cle, '1'); } catch (e) {}
      }).catch(function () { ref.once('value').then(function (s) { compteur.textContent = (s.val() || 0).toLocaleString('fr-FR'); }); });
    }

    // Messages
    var liste = zone.querySelector('.vie-liste');
    var form = zone.querySelector('form');
    var etat = zone.querySelector('.vie-etat');
    function afficher(m) {
      var li = document.createElement('li');
      var qui = document.createElement('strong'); qui.textContent = m.nom;
      var quand = document.createElement('time'); quand.textContent = new Date(m.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      var p = document.createElement('p'); p.textContent = m.texte;
      var tete = document.createElement('div'); tete.className = 'vie-tete'; tete.appendChild(qui); tete.appendChild(quand);
      li.appendChild(tete); li.appendChild(p);
      liste.insertBefore(li, liste.firstChild);
      var vide = zone.querySelector('.vie-vide'); if (vide) vide.hidden = true;
    }
    db.ref('messages/' + page).orderByChild('t').limitToLast(50).on('child_added', function (s) { afficher(s.val()); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.site.value) return;               // champ piège anti-robots
      var nom = form.elements.nom.value.trim(), texte = form.elements.texte.value.trim();
      var maintenant = Date.now(), dernier = 0;
      try { dernier = parseInt(localStorage.getItem('vie-dernier') || '0', 10); } catch (e2) {}
      if (maintenant - dernier < 30000) { etat.textContent = 'Merci de patienter quelques secondes avant un nouveau message.'; return; }
      if (nom.length < 1 || nom.length > 40 || texte.length < 3 || texte.length > 600) { etat.textContent = 'Le pseudo doit faire 40 caractères au plus, le message entre 3 et 600.'; return; }
      if (/https?:|www\./i.test(texte)) { etat.textContent = 'Les liens ne sont pas acceptés dans les messages.'; return; }
      var bouton = form.querySelector('button'); bouton.disabled = true; etat.textContent = 'Envoi…';
      db.ref('messages/' + page).push({ nom: nom, texte: texte, t: firebase.database.ServerValue.TIMESTAMP }).then(function () {
        form.elements.texte.value = ''; etat.textContent = 'Message publié. Merci !';
        try { localStorage.setItem('vie-dernier', String(maintenant)); localStorage.setItem('vie-nom', nom); } catch (e3) {}
        var ej = window.VIE && window.VIE.emailjs;                // notification par courriel (facultative)
        if (ej && ej.service && ej.template && ej.cle) {
          try {
            fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ service_id: ej.service, template_id: ej.template, user_id: ej.cle,
                template_params: { page: page, pseudo: nom, message: texte, lien: location.href } }) }).catch(function () {});
          } catch (e5) {}
        }
      }).catch(function () { etat.textContent = "Le message n'a pas pu être envoyé. Réessayez plus tard."; }).then(function () { bouton.disabled = false; });
    });
    try { var n = localStorage.getItem('vie-nom'); if (n) form.elements.nom.value = n; } catch (e4) {}
  }
})();
