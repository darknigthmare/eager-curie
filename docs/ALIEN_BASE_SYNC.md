# ALIEN BASE ↔ HIVE ASCENSION (EAGER-CURIE)

## Ce qui fonctionne
Le bouton **Archives unifiées** (menu) et **Archives** (HUD) ouvre un catalogue filtrable/recherchable, alimenté par `data/alien-base.snapshot.v1.json`. Il contient 6 identités communes et les fiches publiques du jeu : 16 formes, 10 ennemis, 4 boss, 5 factions de contexte, 21 équipements. La fenêtre n'interrompt aucune fonction du Codex historique. Son absence n'empêche pas de jouer.

Une petite API `window.AlienBaseReference` devient disponible une fois la copie locale chargée :
- `getSharedIdForCaste("ovomorphe")` → `"xeno:ovomorph"`
- `getSharedRecord("xeno:ovomorph")` → identité et nom uniquement
- `listSharedRecords()` → copie des six fiches de référence
- `sourceCommit` → version du contenu du jeu utilisée pour la synchronisation

Le jeu conserve ses 16 IDs de caste, ses règles, équilibrages et sauvegardes inchangés. Un identifiant partagé ne valide ni les stats ni les assets.

## Réactualiser après une fusion dans alien_base
Le producteur de référence est **darknigthmare/alien_base**, PR #6 empilée sur PR #3. Lorsqu'elles sont fusionnées, depuis le checkout local de `alien_base` :

```sh
node scripts/export-hive-ascension.mjs --out ../eager-curie/data/alien-base.snapshot.v1.json
node scripts/export-hive-ascension.mjs --out ../eager-curie/data/alien-base.snapshot.v1.json --check
```

Une fois le fichier actualisé, depuis `eager-curie` : `node tools/qa-alien-base.cjs`. Le test s'arrête si `src/content.js` a été modifié sans mise à jour du pin et du snapshot. La page n'interroge jamais un dépôt privé depuis le navigateur et respecte la CSP locale Vercel.

## Règles de cohérence
- Les identités filmique de base sont reliées par archétype, pas par ressemblance superficielle : Ovomorphe, Facehugger, Chestburster, Drone, Warrior, Queen.
- Runner et variantes étendues restent distincts selon média, hôte, source, variante et continuité : aucun lien automatique vers Alien 3 ou Fireteam Elite.
- MNEMOSYNE, LV-X91, IRISE, KAPPA, R-9, K-12, T-4 et VIGIE sont des éléments du jeu ; ne pas les attribuer à Weyland-Yutani sans preuve.
- Synthétiques et tourelles ne sont pas hôtes viables ; un masque ne devient pas « viable » sans action de jeu.
- La catégorie FILM_CORE du jeu est un niveau de **politique interne** : ce n'est pas une certification visuelle ou documentaire 1:1.
- Les archives originales ne débloquent ni un ennemi, ni une arme, ni une caste.

## Manquants honnêtement identifiés
Il faut encore un audit d'édition et de source pour les formes étendues, des références visuelles sous licence, les variantes hôtes/continuités, les véhicules et équipements non présents dans le catalogue narratif, des tests navigateur interactifs et un raccordement du contenu commun aux futurs moteurs de jeu.
