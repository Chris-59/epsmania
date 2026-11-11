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
