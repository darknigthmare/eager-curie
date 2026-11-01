# Alien Base ↔ HIVE ASCENSION (eager-curie) — intégration v2

## En service sur cette PR
Les Archives unifiées dans le menu et le HUD chargent **localement**, sans jeton ni connexion à GitHub privé, `data/alien-base.snapshot.v2.json`. Le catalogue v2 comporte **380 fiches minimales** : organismes, personnages, factions, équipements et armes, lieux, véhicules, vaisseaux, opposition et boss. Il exclut les **158 cartes TCG** et toute statistique de combat. Les 16 castes, 10 ennemis, 4 boss, 5 factions et 21 équipements du jeu sont conservés dans une catégorie distincte. Chaque fiche expose son ID du registre et son type de référence lorsque disponible.

Le menu fonctionne toujours si le nouveau fichier est manquant : il retombe alors sur `data/alien-base.snapshot.v1.json` (**58 anciennes références**), sans interrompre la partie.

## API de lecture
`window.AlienBaseReference` est créé après le chargement des Archives :
- `getCanonicalIdForCaste('ovomorphe')` → `bio.xenomorph.ovomorph` (v2).
- `getCanonicalIdForCaste('runner')` → `ha.bio.runner` (variante locale, non universelle).
- `getSharedIdForCaste('ovomorphe')` → `xeno:ovomorph` (compatibilité v1).
- `getSharedRecord('xeno:ovomorph')` → fiche v2 si disponible, via la table de correspondances explicite.
- `listSharedRecords()` → copie des références minimales, jamais stats/IA/animations.

**Aucun identifiant de sauvegarde n'est modifié.** Une identité ou arme apparaît dans les archives uniquement ; elle ne devient pas une unité jouable.

## Producteur et ordre GitHub
Le registre cible n'est plus la PR #3 (désormais archive d'ingestion) :
1. [Alien_base #4](https://github.com/darknigthmare/alien_base/pull/4) — registre unifié.
2. [Alien_base #8](https://github.com/darknigthmare/alien_base/pull/8) — compatibilité et dossiers de recherche.
3. [Alien_base #15](https://github.com/darknigthmare/alien_base/pull/15) — ajout Hive Ascension et export v2.
4. [Eager-curie #2](https://github.com/darknigthmare/eager-curie/pull/2) — consommation du snapshot v2.

Le fichier est produit par :
```sh
node scripts/export-hive-ascension.mjs --out ../eager-curie/data/alien-base.snapshot.v2.json
node scripts/export-hive-ascension.mjs --out ../eager-curie/data/alien-base.snapshot.v2.json --check
```

Depuis le dépôt du jeu : `node tools/qa-alien-base.cjs`. Le QA vérifie que `src/content.js` reste identique à la source épinglée SHA Git. Une nouvelle version du contenu doit d'abord être réimportée dans Alien_base puis réexportée et validée avant d'actualiser la PR du jeu.

## Contenus strictement séparés
Les stats du jeu résident dans `data/gameplay/hive-ascension.v1.json` côté référentiel central ; elles ne contaminent pas les autres moteurs. MNEMOSYNE, IRISE, KAPPA, R-9, K-12, T-4, VIGIE et ÉCHO-12 sont des créations de la campagne, pas des fiches canoniques de Weyland-Yutani.

La branche `codex/remainder-20261101@be04f892` diverge de main. Elle corrige la classification de Royal Facehugger et de l'Offspring Z-01, mais ne doit pas remplacer le moteur actuel sans vraie réconciliation et tests graphiques/QA. Les modèles, armes, véhicules et animations ne sont pas automatiquement intégrés ou certifiés 1:1.
