/* Le Levier IA : amélioration progressive, sans dépendance. Sans ce script, chaque page reste complète.
   1. Page d'accueil : si la page est lue un autre jour que celui de sa construction, l'avis indique que
      l'édition affichée n'est pas celle du jour (jamais d'ancienne édition présentée comme celle du jour).
   2. Archives : recherche et filtre par rubrique dans l'index recherche.json, état reflété dans l'URL.
   3. Partage : feuille de partage du téléphone (navigator.share) et copie du lien. Sans script, le lien reste
      affiché et les liens courriel, LinkedIn, Facebook et WhatsApp fonctionnent. */
(function () {
  "use strict";
  var body = document.body;
  var tz = body.getAttribute("data-timezone") || "America/Toronto";
  var root = body.getAttribute("data-root") || "";

  function parts(date) {
    var out = {};
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).forEach(function (p) {
      out[p.type] = p.value;
    });
    return out;
  }

  function longDate(iso) {
    var d = new Date(iso + "T12:00:00Z");
    return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long",
      year: "numeric" }).format(d);
  }

  function refreshNotice() {
    var notice = document.querySelector(".notice[data-latest]");
    if (!notice) return;
    var latest = notice.getAttribute("data-latest");
    if (!latest) return;
    var now = parts(new Date());
    var today = now.year + "-" + now.month + "-" + now.day;
    if (latest === today) {
      if (notice.getAttribute("data-state") !== "du-jour") notice.hidden = true;
      return;
    }
    var publish = (body.getAttribute("data-publish-time") || "08:00").split(":");
    var minutes = parseInt(now.hour, 10) * 60 + parseInt(now.minute, 10);
    var late = minutes >= parseInt(publish[0], 10) * 60 + parseInt(publish[1] || "0", 10);
    var hour = parseInt(publish[0], 10) + " h" + (publish[1] && publish[1] !== "00" ? " " + publish[1] : "");
    var p = document.createElement("p");
    if (late) {
      var strong = document.createElement("strong");
      strong.textContent = "L’édition du " + longDate(today) + " n’est pas encore parue.";
      p.appendChild(strong);
      p.appendChild(document.createTextNode(" Vous lisez la dernière édition parue, datée du " + longDate(latest) + "."));
      notice.classList.add("notice-late");
    } else {
      p.textContent = "La prochaine édition paraît aujourd’hui à " + hour + ", heure de Montréal. Vous lisez l’édition du " +
        longDate(latest) + ".";
      notice.classList.remove("notice-late");
    }
    notice.replaceChildren(p);
    notice.hidden = false;
  }

  function normalize(text) {
    return (text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function setupSearch() {
    var form = document.querySelector("[data-search]");
    if (!form || !window.fetch) return;
    var input = form.querySelector("input[type=search]");
    var results = form.querySelector("[data-search-results]");
    var count = form.querySelector("[data-search-count]");
    var list = document.querySelector("[data-archive-list]");
    var items = null;
    var timer = null;

    function rubrique() {
      var checked = form.querySelector("input[name=rubrique]:checked");
      return checked ? checked.value : "";
    }

    function syncUrl(q, r) {
      var params = new URLSearchParams();
      if (q) params.set("q", q);
      if (r) params.set("rubrique", r);
      var query = params.toString();
      history.replaceState(null, "", location.pathname + (query ? "?" + query : ""));
    }

    function render() {
      var q = input.value.trim();
      var r = rubrique();
      syncUrl(q, r);
      results.replaceChildren();
      if (!q && !r) {
        count.textContent = "";
        if (list) list.hidden = false;
        return;
      }
      if (list) list.hidden = true;
      if (!items) {
        count.textContent = "Chargement de l’index…";
        return;
      }
      var terms = normalize(q).split(/\s+/).filter(Boolean);
      var found = items.filter(function (it) {
        if (r && it.r !== r) return false;
        var hay = normalize(it.t + " " + it.x + " " + it.l + " " + it.s);
        return terms.every(function (t) { return hay.indexOf(t) !== -1; });
      });
      count.textContent = found.length === 0 ? "Aucun résultat. Essayez un autre mot ou une autre rubrique." :
        found.length + (found.length > 1 ? " résultats" : " résultat") + (found.length > 60 ? ", 60 premiers affichés" : "");
      found.slice(0, 60).forEach(function (it) {
        var li = document.createElement("li");
        var meta = document.createElement("span");
        meta.className = "r-meta";
        meta.textContent = longDate(it.d) + ", " + it.l.toLowerCase() + (it.s ? ", " + it.s : "");
        var a = document.createElement("a");
        a.href = root + it.u;
        a.textContent = it.t;
        var text = document.createElement("span");
        text.className = "r-text";
        text.textContent = it.x;
        li.appendChild(meta);
        li.appendChild(a);
        if (it.x && it.x !== it.t) li.appendChild(text);
        results.appendChild(li);
      });
    }

    form.hidden = false;
    var params = new URLSearchParams(location.search);
    if (params.get("q")) input.value = params.get("q");
    if (params.get("rubrique")) {
      var radio = form.querySelector("input[name=rubrique][value='" + params.get("rubrique").replace(/[^a-z-]/g, "") + "']");
      if (radio) radio.checked = true;
    }
    form.addEventListener("submit", function (ev) { ev.preventDefault(); render(); });
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(render, 150); });
    form.addEventListener("change", function (ev) { if (ev.target.name === "rubrique") render(); });
    fetch(root + "recherche.json", { credentials: "same-origin" })
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (data) { items = data.items || []; render(); })
      .catch(function () { count.textContent = "La recherche est indisponible pour le moment ; la liste complète reste ci-dessous."; if (list) list.hidden = false; });
    render();
  }

  // Repli pour les navigateurs sans presse-papiers asynchrone : champ masqué (classe, pas de style en ligne : CSP).
  function legacyCopy(url) {
    var area = document.createElement("textarea");
    area.value = url;
    area.setAttribute("readonly", "");
    area.className = "sr-only";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function copyLink(url) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(url).then(function () { return true; },
        function () { return legacyCopy(url); });
    }
    return Promise.resolve(legacyCopy(url));
  }

  function shareData(block) {
    return { title: block.getAttribute("data-share-title") || document.title,
      text: block.getAttribute("data-share-text") || "", url: block.getAttribute("data-share-url") };
  }

  function nativeShare(block) {
    navigator.share(shareData(block)).catch(function () { /* partage annulé : rien à signaler */ });
  }

  function setupShare() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-share]"), function (block) {
      var status = block.querySelector("[data-share-status]");
      var native = block.querySelector("[data-share-native]");
      var copy = block.querySelector("[data-share-copy]");
      function say(text) {
        status.textContent = "";
        setTimeout(function () { status.textContent = text; }, 60);  // annoncé à nouveau à chaque clic
      }
      if (native && navigator.share) {
        native.hidden = false;
        native.addEventListener("click", function () { nativeShare(block); });
      }
      if (copy && status) {
        copy.hidden = false;
        copy.addEventListener("click", function () {
          copyLink(block.getAttribute("data-share-url")).then(function (ok) {
            say(ok ? "Lien copié : collez-le dans un message, un courriel ou une publication."
              : "Copie impossible ici : copiez le lien de l’édition ci-dessus (appui long ou clic droit).");
          });
        });
      }
    });
    // « Partager » en tête d'édition : la feuille de partage du téléphone s'il y en a une, sinon le bloc de partage.
    Array.prototype.forEach.call(document.querySelectorAll("[data-share-jump]"), function (link) {
      var block = document.getElementById((link.getAttribute("href") || "").slice(1));
      if (!block || !navigator.share) return;
      link.addEventListener("click", function (ev) {
        ev.preventDefault();
        nativeShare(block);
      });
    });
  }

  refreshNotice();
  setupSearch();
  setupShare();
})();
