/* HIVE ASCENSION — Alien Base reference browser (no runtime GitHub/private API requests). */
(() => {
  "use strict";
  const SOURCES = ["data/alien-base.snapshot.v2.json", "data/alien-base.snapshot.v1.json"];
  const KIND = {
    castes: "FORMES BIOLOGIQUES",
    enemies: "OPPOSITION",
    bosses: "BOSS",
    factions: "FACTIONS",
    equipment: "ÉQUIPEMENTS",
    shared: "IDENTITÉS COMMUNES"
  };
  const SHARED_KINDS = {
    organism: "ORGANISMES DE RÉFÉRENCE", character: "PERSONNAGES DE RÉFÉRENCE",
    opposition: "OPPOSITION MNEMOSYNE", boss: "BOSS MNEMOSYNE",
    equipment: "ARMES ET ÉQUIPEMENTS", faction: "FACTIONS ET ORGANISATIONS",
    place: "LIEUX DE RÉFÉRENCE", vehicle: "VÉHICULES / VAISSEAUX", vessel: "VAISSEAUX",
    weapon: "ARMES DE RÉFÉRENCE", location: "LIEUX DE RÉFÉRENCE",
    "source-profile": "DOSSIERS BIOLOGIQUES ARCHIVÉS",
    "source-equipment-profile": "ÉQUIPEMENTS DOCUMENTAIRES ARCHIVÉS"
  };
  let overlay, list, detail, queryInput, typeFilter, count, status;
  let entries = [], snapshot = null, selected = null, previousFocus = null;
  let loadPromise = null;
  const normal = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const node = (tag, className, content) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (content !== undefined) n.textContent = String(content);
    return n;
  };
  function row(label, value) {
    const wrapper = node("div", "ab-detail-row");
    wrapper.append(node("dt", "", label), node("dd", "", value || "Non documenté"));
    return wrapper;
  }
  function createInterface() {
    const bootActions = document.querySelector("#boot-screen .front-actions");
    const hudActions = document.querySelector("#hud-header .utility-controls");
    if (!bootActions && !hudActions) return;
    if (bootActions) {
      const btn = node("button", "front-tertiary", "ARCHIVES UNIFIÉES");
      btn.type = "button"; btn.id = "btn-open-alien-base-menu";
      btn.addEventListener("click", open);
      bootActions.appendChild(btn);
    }
    if (hudActions) {
      const btn = node("button", "utility-btn", "ARCHIVES");
      btn.type = "button"; btn.id = "btn-open-alien-base-hud";
      btn.title = "Ouvrir les références Alien Base";
      btn.addEventListener("click", open);
      hudActions.appendChild(btn);
    }
    overlay = node("div", "ab-overlay");
    overlay.id = "alien-base-overlay";
    overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "alien-base-title");
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    const panel = node("section", "ab-panel");
    const header = node("header", "ab-header");
    const heading = node("div");
    heading.append(node("span", "ab-kicker", "BASE DE DONNÉES // TRANSMISSION MNEMOSYNE"));
    const title = node("h2", "", "ARCHIVES ALIEN / AVP"); title.id = "alien-base-title";
    heading.append(title);
    const close = node("button", "ab-close", "FERMER ×"); close.type = "button"; close.id = "btn-close-alien-base";
    close.addEventListener("click", shut);
    header.append(heading, close);
    const intro = node("p", "ab-intro", "Identités partagées et dossiers du jeu. Les classifications sont des références de recherche : elles ne certifient ni les modèles 1:1 ni les statistiques de combat.");
    const controls = node("div", "ab-controls");
    const searchLabel = node("label", "", "RECHERCHER");
    queryInput = node("input"); queryInput.type = "search"; queryInput.placeholder = "Caste, arme, faction, identifiant…";
    queryInput.id = "alien-base-search"; searchLabel.htmlFor = queryInput.id;
    queryInput.addEventListener("input", renderList);
    const filterLabel = node("label", "", "DOMAINE");
    typeFilter = node("select"); typeFilter.id = "alien-base-filter"; filterLabel.htmlFor = typeFilter.id;
    for (const [value, titleText] of [["all", "TOUTES LES FICHES"], ...Object.entries(KIND), ...Object.entries(SHARED_KINDS).map(([key, name]) => ["shared:" + key, name])]) {
      const opt = node("option", "", titleText); opt.value = value; typeFilter.appendChild(opt);
    }
    typeFilter.addEventListener("change", renderList);
    controls.append(searchLabel, queryInput, filterLabel, typeFilter);
    count = node("p", "ab-count", "Chargement des archives…");
    const layout = node("div", "ab-layout");
    list = node("nav", "ab-list"); list.id = "alien-base-list";
    list.setAttribute("aria-label", "Références Alien Base");
    detail = node("article", "ab-detail", "Sélectionnez une fiche.");
    detail.id = "alien-base-detail"; detail.tabIndex = 0;
    layout.append(list, detail);
    status = node("p", "ab-footnote", "Snapshot local uniquement · aucun accès réseau au référentiel privé");
    panel.append(header, intro, controls, count, layout, status);
    overlay.appendChild(panel);
    document.getElementById("app-container").appendChild(overlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) shut(); });
    window.AlienBaseOpenCaste = async (id) => {
      await open();
      if (!snapshot) return false;
      const target = entries.find(e => e.group === "castes" && e.id === String(id));
      if (!target) return false;
      typeFilter.value = "castes";
      queryInput.value = "";
      selected = target.key;
      renderList();
      detail.focus();
      return true;
    };
    document.addEventListener("keydown", (e) => {
      if (overlay.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault(); e.stopImmediatePropagation(); shut(); return;
      }
      if (e.key === "Tab") {
        const focusable = Array.from(overlay.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex='0']"));
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }, true);
  }
  function prepare(data) {
    const v2 = data?.schemaVersion === "2.0.0" && data?.format === "alien-base-registry-consumer-v2";
    const v1 = data?.schemaVersion === "1.0.0" && data?.scope === "public-minimal";
    if ((!v1 && !v2) || !Array.isArray(data.records) || !data.projectIntake || (!v2 && !Array.isArray(data.crosswalks))) {
      throw new Error("Format Alien Base non reconnu.");
    }
    if (!/^[a-f0-9]{40}$/.test(data.sourceContent?.commit || "") || !/^[a-f0-9]{40}$/.test(data.sourceContent?.blobSha || "")) {
      throw new Error("Provenance non épinglée.");
    }
    if (v2 && (data.records.some(e => e.kind === "game-card") || !data.bindings?.castes || !Array.isArray(data.compatibility))) {
      throw new Error("Export v2 incohérent ou non filtré.");
    }
    snapshot = data;
    entries = [];
    for (const kind of ["castes", "enemies", "bosses", "factions", "equipment"]) {
      for (const e of data.projectIntake[kind] || []) {
        const localId = e.id || e.name || e.entityId;
        entries.push({ ...e, group: kind, displayId: localId, key: kind + ":" + localId });
      }
    }
    for (const e of data.records) entries.push({ ...e, group: "shared", displayId: e.id, key: "shared:" + e.id });
    const linked = v2 ? new Map(Object.entries(data.bindings.castes).map(([local, info]) => [local, info.id])) :
      new Map(data.crosswalks.filter(x => x.collection === "HIVE_CONTENT_CASTES").map(x => [x.legacyId, x.sharedId]));
    const oldIds = v2 ? new Map(data.compatibility.map(x => [x.registryId, x.legacySharedId])) : new Map();
    const legacyCasteIds = v2 ? new Map([...linked].map(([local, id]) => [local, oldIds.get(id) || null])) : linked;
    const idLookup = new Map(data.records.map(e => [e.id, e]));
    window.AlienBaseReference = Object.freeze({
      schemaVersion: data.schemaVersion,
      getSharedIdForCaste: (id) => legacyCasteIds.get(String(id)) || null,
      getCanonicalIdForCaste: (id) => linked.get(String(id)) || null,
      getSharedRecord: (id) => idLookup.get(String(id)) ||
        idLookup.get((data.compatibility || []).find(x => x.legacySharedId === id)?.registryId) || null,
      listSharedRecords: () => data.records.map(e => ({...e})),
      sourceCommit: data.sourceContent.commit,
      scope: data.scope
    });
  }
  function itemLabel(e) {
    return e.group === "shared" ? "RÉF. " + (SHARED_KINDS[e.kind] || e.kind) : (e.group === "castes" && e.entityId ? "ID " + e.entityId : (e.group === "castes" && e.sharedId ? "RÉF. " + e.sharedId : KIND[e.group]));
  }
  function describe(e) {
    detail.replaceChildren();
    detail.appendChild(node("span", "ab-kicker", e.group === "shared" ? (SHARED_KINDS[e.kind] || "RÉFÉRENTIEL") : KIND[e.group]));
    detail.appendChild(node("h3", "", e.name));
    detail.appendChild(node("p", "ab-detail-summary", e.role || e.title || (
      e.group === "shared" ? "Identité bibliographique commune, sans statistiques de jeu." :
      "Dossier issu de la campagne originale MNEMOSYNE."
    )));
    const table = node("dl", "ab-facts");
    table.appendChild(row("Identifiant", e.displayId));
    if (e.sharedId) table.appendChild(row("Identité commune", e.sharedId));
    if (e.entityId) table.appendChild(row("ID du registre", e.entityId));
    if (e.classification) table.appendChild(row("Type de référence", e.classification));
    if (e.biology) table.appendChild(row("Biologie / technologie", e.biology));
    if (e.originGame) table.appendChild(row("Origine du dossier", e.originGame));
    if (e.group === "shared") table.appendChild(row("Domaine", SHARED_KINDS[e.kind] || e.kind));
    if (e.sourceLoreStatus) table.appendChild(row("Statut annoncé par le jeu", e.sourceLoreStatus));
    if (e.group === "enemies") {
      table.appendChild(row("Faction", e.faction));
      table.appendChild(row("Compatibilité hôte", e.hostEligibility === "none" ? "Non — synthétique / machine" :
        e.hostEligibility === "protected" ? "Protégé — non exposé sans préparation" : e.hostEligibility));
    }
    if (e.group === "bosses") {
      table.appendChild(row("Acte", e.actId));
      table.appendChild(row("Hôte", e.hostEligibility));
    }
    if (e.group === "equipment") table.appendChild(row("Utilisé par", (e.usedBy || []).join(", ")));
    detail.appendChild(table);
    if (e.entityId && e.group !== "shared" && snapshot?.records?.some(x => x.id === e.entityId)) {
      const jump = node("button", "ab-record-jump", "CONSULTER LA RÉFÉRENCE COMMUNE");
      jump.type = "button";
      jump.addEventListener("click", () => {
        typeFilter.value = "all";
        queryInput.value = "";
        selected = "shared:" + e.entityId;
        renderList();
        detail.focus();
      });
      detail.appendChild(jump);
    }
    detail.appendChild(node("p", "ab-warning", e.group === "shared" ?
      "Référence commune : identité seulement, pas d'asset ni de valeurs de combat." :
      "Entrée provenant du jeu : aucune certification canonique 1:1. Les variantes originales ne sont pas des castes universelles."));
    if (snapshot?.sourceContent?.commit && e.group !== "shared") {
      const a = node("a", "ab-source-link", "Consulter le fichier source épinglé");
      a.href = "https://github.com/darknigthmare/eager-curie/blob/" + snapshot.sourceContent.commit + "/src/content.js";
      a.target = "_blank"; a.rel = "noopener noreferrer";
      detail.appendChild(a);
    }
  }
  function renderList() {
    if (!list || !snapshot) return;
    const q = normal(queryInput.value), group = typeFilter.value;
    const filtered = entries.filter(x => (group === "all" || x.group === group || (x.group === "shared" && group === "shared:" + x.kind)) &&
      normal([x.name, x.id, x.entityId, x.role, x.faction, x.sharedId, x.title, x.classification, x.kind].join(" ")).includes(q));
    count.textContent = filtered.length + " FICHE(S) • " + snapshot.records.length + " RÉFÉRENCES DU REGISTRE • " + snapshot.projectIntake.castes.length + " FORMES DU JEU";
    list.replaceChildren();
    if (!filtered.length) {
      list.appendChild(node("p", "ab-empty", "Aucune fiche pour cette recherche."));
      detail.replaceChildren(node("p", "", "Modifiez les filtres ou la recherche."));
      return;
    }
    if (!filtered.some(x => x.key === selected)) selected = filtered[0].key;
    for (const e of filtered) {
      const btn = node("button", "ab-record", e.name);
      btn.type = "button"; btn.setAttribute("aria-pressed", String(e.key === selected));
      btn.appendChild(node("small", "", itemLabel(e)));
      btn.addEventListener("click", () => {
        selected = e.key; describe(e);
        for (const other of list.querySelectorAll("button.ab-record")) other.setAttribute("aria-pressed", String(other === btn));
      });
      list.appendChild(btn);
    }
    describe(filtered.find(x => x.key === selected) || filtered[0]);
  }
  async function load() {
    if (snapshot) return;
    if (!loadPromise) loadPromise = (async () => {
      let failure = null;
      for (const url of SOURCES) {
        try {
          const response = await fetch(url, {cache: "no-cache"});
          if (!response.ok) throw new Error("HTTP " + response.status + " : " + url);
          prepare(await response.json());
          return;
        } catch (error) { failure = error; }
      }
      throw failure || new Error("Aucun snapshot local disponible.");
    })().catch((error) => { loadPromise = null; throw error; });
    await loadPromise;
  }
  async function open() {
    if (!overlay) return;
    previousFocus = document.activeElement;
    overlay.hidden = false; overlay.setAttribute("aria-hidden", "false");
    queryInput.focus(); count.textContent = "Lecture de la copie locale…";
    try { await load(); renderList(); status.textContent = "Registre " + snapshot.schemaVersion + " • source " + snapshot.sourceContent.commit.slice(0, 12) + " • offline / sans GitHub privé"; }
    catch (error) {
      count.textContent = "ARCHIVES INDISPONIBLES";
      list.replaceChildren();
      detail.replaceChildren(node("p", "ab-warning", String(error.message || error)));
      status.textContent = "Le jeu reste jouable sans la base de référence.";
    }
  }
  function shut() {
    if (!overlay) return;
    overlay.hidden = true; overlay.setAttribute("aria-hidden", "true");
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
  }
  document.addEventListener("DOMContentLoaded", createInterface);
})();
