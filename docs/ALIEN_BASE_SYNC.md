# Alien Base ↔ HIVE ASCENSION (eager-curie) — intégration v2

## En service sur cette PR
Les Archives unifiées dans le menu et le HUD chargent **localement**, sans jeton ni connexion à GitHub privé, `data/alien-base.snapshot.v2.json`. Le catalogue v2 comporte **494 fiches minimales** : organismes, personnages, factions, équipements et armes, lieux, véhicules, vaisseaux, opposition et boss. Il exclut les **158 cartes TCG** et toute statistique de combat. Les 16 castes, 10 ennemis, 4 boss, 5 factions et 21 équipements du jeu sont conservés dans une catégorie distincte. Chaque fiche expose son ID du registre et son type de référence lorsque disponible.

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
3. [Alien_base #21](https://github.com/darknigthmare/alien_base/pull/21) — ajout Hive Ascension et export v2.
4. [Alien_base #23](https://github.com/darknigthmare/alien_base/pull/23) — correctifs biologiques source-vérifiés et réexport du snapshot consolidé.
5. [Eager-curie #2](https://github.com/darknigthmare/eager-curie/pull/2) — consommation du snapshot v2.

Le fichier est produit par :
```sh
node scripts/export-hive-ascension.mjs --out ../eager-curie/data/alien-base.snapshot.v2.json
node scripts/export-hive-ascension.mjs --out ../eager-curie/data/alien-base.snapshot.v2.json --check
```

Depuis le dépôt du jeu : `node tools/qa-alien-base.cjs`. Le QA vérifie que `src/content.js` reste identique à la source épinglée SHA Git. Une nouvelle version du contenu doit d'abord être réimportée dans Alien_base puis réexportée et validée avant d'actualiser la PR du jeu.

## Contenus strictement séparés
Les stats du jeu résident dans `data/gameplay/hive-ascension.v1.json` côté référentiel central ; elles ne contaminent pas les autres moteurs. MNEMOSYNE, IRISE, KAPPA, R-9, K-12, T-4, VIGIE et ÉCHO-12 sont des créations de la campagne, pas des fiches canoniques de Weyland-Yutani.

La branche `codex/remainder-20261101@be04f892` diverge de main. Elle corrige la classification de Royal Facehugger et de l'Offspring Z-01, mais ne doit pas remplacer le moteur actuel sans vraie réconciliation et tests graphiques/QA. Les modèles, armes, véhicules et animations ne sont pas automatiquement intégrés ou certifiés 1:1.

## Archives documentaires de World Hive Wars (rattrapage PR #4)

La PR #4 du registre a reçu **68 équipements et 26 profils biologiques documentaires** après la création initiale de #8. Ces 94 fiches sont incluses dans le snapshot v2 du jeu avec leurs identifiants centraux inchangés et leurs catégories `source-profile` / `source-equipment-profile`. Elles n'activent aucun spawn, boutique, IA, arme utilisable ou capacité, et n'impliquent pas une fidélité visuelle 1:1. Le répertoire de sauvegarde de HIVE ASCENSION reste inchangé.

## Passage direct entre le Codex et le registre

Une entrée **de caste déjà déverrouillée** dans le Codex narratif affiche désormais « CONSULTER LA RÉFÉRENCE ALIEN BASE ». Cette commande ouvre la forme exacte par ID local dans les Archives unifiées, puis son bouton « CONSULTER LA RÉFÉRENCE COMMUNE » rejoint l'identité correspondante. Les entrées verrouillées ne donnent aucun accès indirect aux descriptions et le statut `ha.*` d'une variante originale reste visible. Retour au Codex avec Échap. Les sauvegardes et la logique d'évolution ne sont pas modifiées.


## Synchronisation du 1er novembre 2026
L'export local contient désormais **494 identités**, dont les 20 dernières références documentaires Yautja (13 personnages, 5 équipements, 2 véhicules) issues du registre consolidé. Aucune de ces références n'est débloquée en gameplay par cette mise à jour.

Le nouveau `src/content.js` est basé sur un correctif de contenu épinglé au commit `dd3d417b103a56a2c9f3b6510040106df6693926` (blob `21a4b3a88b8183ef54b3370b4c994265030ffc09`) et comporte neuf clarifications de biologie/lore : Facehugger royal, Offspring Z-01, Crusher, Reine, Palatine, Ovomorphe, Facehugger, Chestburster, Prowler. Les **IDs et sauvegardes sont inchangés**.

Pour comparer votre checkout du jeu et le catalogue central sur disque, sans service réseau :
```sh
node tools/sync-alien-base.mjs --source ../alien_base/exports/hive-ascension.v2.json --check
node tools/sync-alien-base.mjs --source ../alien_base/exports/hive-ascension.v2.json
# Après revue des changements du catalogue :
node tools/sync-alien-base.mjs --source ../alien_base/exports/hive-ascension.v2.json --write
```
La commande refuse un blob de contenu non correspondant, les cartes TCG de gameplay, les doublons et les champs de dossier non publics.

**Chaîne de PR** : Alien Base #21 → Alien Base #23 → Eager-curie #2. Les anciens exports #6/#15 restent des jalons historiques : ne pas tenter des fusions parallèles vers main. Les essais graphiques et la fidélité 1:1 des modèles restent distincts des tests documentaires.

## Vérification du 2 novembre 2026 : nouvel espace d'œuvres

La branche `main` du référentiel est inchangée. La [PR Alien Base #22](https://github.com/darknigthmare/alien_base/pull/22) introduit 29 identités `work.*` (films, jeux, comics, romans, bonus et archives de production), séparées des 494 entités du jeu. Le snapshot `data/alien-base.media.v2.json` reproduit exactement son export public minimal.

**Source épinglée** : Alien Base #22, commit `9f5cc1a40a7536047f256d3c391eb18800f99e94`, `data/works/yautja-apex.v1.json` (blob SHA `10b3d93e7b7e10ff1496e4cdb67fcea5bfcf6d0c`). Les 29 références restent déclaratives et non vérifiées individuellement ; aucune source privée, URL, asset, statistique ou clé de sauvegarde n'est exposé dans le fichier distribué.

La [PR Alien Base #24](https://github.com/darknigthmare/alien_base/pull/24) apporte trois alias propres à Apex Hunter (Alpha, Samurai, Viking) sans modifier les 494 fiches ou les bindings Hive Ascension. Aucune conversion de caste ni d'équipement de Hive Ascension n'est requise.

Le catalogue média fonctionne **hors ligne** dans le filtre « ŒUVRES / MÉDIAS ». Si le fichier média manque, la bibliothèque principale reste disponible. Ses notices n'activent pas de mission ou de créature et ne certifient pas une représentation fidèle 1:1.

Pour un futur rafraîchissement depuis le checkout Alien Base :

```sh
cd ../alien_base
node scripts/export-apex-media.mjs --out ../eager-curie/data/alien-base.media.v2.json
cd ../eager-curie
node tools/qa-alien-base-media.cjs
node tools/qa-alien-base-ui.cjs
node tools/sync-alien-base-media.mjs --source data/alien-base.media.v2.json --check
```

Les PR #22/#24 sont parallèles à #23 et restent non fusionnées. Leur réconciliation GitHub sera nécessaire avant de constituer un registre principal unique.
