# Reprise HIVE ASCENSION — 9 novembre 2026

## Références et périmètre

Base de travail : `eager-curie/main@7fd6c46e7af57ae52de0efc7142314cae2ac0dc7`, incluant les chantiers 130–134. Le checkout préexistant sur `work@b47771d` est conservé ; la reprise se fait dans un worktree séparé, sur `codex/bible-continuation-20261109`.

Les fichiers Excel et la bible annoncés ne figurent pas dans cet arbre GitHub ni dans la branche documentaire `feat/alien-base-unified-codex-20261101@308fd0f`. Leur lien exact a été demandé. Aucun alignement avec des documents non retrouvés n'est revendiqué.

Références réellement lues :

- `AGENTS.md`, `.ai-tools/README.md` et `.ai-tools/sources.json` du main actuel ; le diagnostic local indique que les intégrations Spec Kit/Studio ne sont pas activées, sans certifier un plugin global.
- `docs/ALIEN_BASE_SYNC.md` de la branche documentaire, qui reste non fusionnée.
- `alien_base@c01c621a9e9b0adaf884f5dea09b09287dd945cf/docs/HIVE_ASCENSION_BRIDGE_V2.md` et `docs/HIVE_ASCENSION_LORE_RECONCILIATION.md`.

Le catalogue Alien Base reste documentaire : pas d'activation de nouvelle unité, arme, statistique ou asset. Les IDs, sauvegardes, données de `src/content.js` et valeurs d'équilibrage ne sont pas modifiés. Ni l'ancienne branche `be04` ni le prototype T140 ne remplacent le moteur récent.

## Spécification du lot technique

Parcours : le mortier M40 repère la position actuelle du joueur, annonce le point d'arrivée, puis applique une seule explosion après 0,65 seconde de **simulation**, seulement dans le contexte de partie et d'acteurs qui a émis le tir. La pause suspend la progression. Le joueur peut esquiver le point visé, qui ne le suit pas.

Défaut reproduit sur la méthode réelle du main : le `setTimeout(650)` du mortier peut infliger 48 dégâts après mise en pause ou remplacement du stage. La reproduction Node remplace explicitement l'horloge, les sorties audio et la réception de dégâts ; elle n'est pas une partie humaine.

Invariants :

- Dégâts 48, rayon 5,5, portée 7–26, récupération 4,8 secondes, délai 0,65 seconde conservés.
- Aucun timer mural ni effet de dégâts déclenché par un callback de VFX.
- Changement de partie, stage, mesh, forme ou caste : ancien tir invalidé.
- Obus déjà lancé : la destruction du lanceur n'annule pas son inertie ; aucun nouveau tir du mortier détruit. C'est une règle technique explicitement retenue pour ce lot, pas une règle attribuée à une bible absente.
- La réduction des mouvements conserve un repère statique et ne raccourcit jamais le délai d'impact.
- Les règles existantes de rayon explosif au point visé sont conservées. Ce lot n'ajoute pas de nouvelle immunité, de statistique biologique ni de règle universelle de couverture.

### Blocages de démarrage découverts sur le main

La compilation du fichier original échouait avant même l'entrée en jeu : neuf méthodes audio se trouvaient hors de la classe `AudioManager`, puis deux déclarations `const nearIncubator` entraient en conflit dans la même méthode d'interaction. Les erreurs initiales restent conservées séparément sous `.tools/boot-20261109/`.

Les neuf méthodes sont réintégrées à la classe et utilisent son routage réel `connect`, sans les API inexistantes `_calcSpatialPan`/`sfxGain`. Leurs fréquences, enveloppes, durées, noms et rayons sont conservés. La variable de la cuve transgénique devient `nearTransgenicIncubator` ; la priorité du rack médical et les deux handlers restent distincts.

## Plan et suivi uniques

- [x] Vérifier le main actuel, préserver le checkout et lire les contrats disponibles.
- [x] Reproduire le défaut de temps mural avant modification.
- [x] Remplacer le délai par un tir en attente, borné au contexte et résolu exactement une fois.
- [x] Ajouter une annonce visuelle locale, annulable, sans autorité sur les dégâts.
- [x] Corriger les deux erreurs syntaxiques préexistantes et le routage des neuf SFX concernés.
- [x] Exécuter les tests des méthodes réelles puis le scénario navigateur, rendu et audio compris.
- [x] Revoir le diff, vérifier le main distant une dernière fois et livrer le lot par commit local, sans push.

## Validation

La première cohorte navigateur `.tools/m40-native-20261109-final-1/results.json` est complète : 11 contrôles, quatre captures et trois PCM natifs du mortier. Aucun échec de ressource ni erreur JavaScript/console. Les dix scripts de jeu interceptés et les 38 ressources HTML/CSS/assets observées correspondent aux fichiers locaux ; l'inventaire runtime avant/après est identique.

Le parcours vérifie le tir, le délai sans impact anticipé, les handlers DOM de pause/reprise, l'absence de déclenchement après 800 ms de pause réelle, l'impact unique de 48 PV, l'esquive au clavier sans traversée des colliders échantillonnés, la destruction du lanceur, le remplacement du stage et les mouvements réduits. Les quatre rendus ont une caméra diagnostique ; le repère est visible avant impact en mode normal et réduit. Les captures ne certifient ni toutes les occultations du niveau ni les performances GPU.

Le signal natif du mortier actif a un pic de 0,32861 ; les modes muet et volume nul sont silencieux. Il s'agit de rendu PCM par `OfflineAudioContext`, pas d'écoute humaine. La pause empêche **de nouveaux** SFX/impacts du mortier ; ce lot ne suspend pas le contexte audio global ni les sons déjà commencés.

Les positions, cooldowns, drone sans mutation et 1000 PV sont des fixtures explicitement préparées. Le déplacement passe par les handlers clavier et `Player.update` réels ; les sous-systèmes pertinents sont avancés à pas fixe, pas une campagne libre intégralement jouée via RAF. L'export d'observation ajouté à la réponse de `game.js` ne remplace pas les méthodes de production. Les essais échoués restent conservés sous `.tools/`.

La cohorte finale Node `.tools/continuation-20261109-node-final-3/summary.json` passe : six suites, 109 cas/groupes/gabarits au total (modèles 31, détails 18, organique 17, mortier 16, audio 23, dispatch/démarrage 4). Les géométries contrôlées restent procédurales : ce résultat ne valide pas des modèles modernes ni une fidélité cinéma.

Les 49 analyses syntaxiques passent : 35 fichiers JavaScript/CJS/MJS sous `src/` et `tools/`, plus 14 fichiers Python analysés par AST. Les 79 fichiers publics et 22 outils inventoriés ont des empreintes identiques avant/après. Les 14 scripts effectivement référencés par `index.html` sont aussi compilés dans le contrat de démarrage. Les 13 tests unitaires `.ai-tools` ont passé séparément ; ce sont des tests d'outillage, exclus des 109 résultats du lot.

Le premier runner Node a été interrompu sur une lecture stdin bloquée et le second a échoué sur des sous-processus refusés par le sandbox. Leurs preuves restent sous `.tools/continuation-20261109-node-final/` et `-final-2/`. Seule la cohorte `-final-3`, exécutée avec les permissions locales nécessaires, est acceptée : six exit codes nuls et leurs sorties réelles non vides.

Empreintes runtime acceptées :

```text
src/game.js         a97b770f5fa10fc66be8a8b4f534f57086e3ad4e9be8f9f927579c32b1543e75
src/game-systems.js 8a091507224a3637124c8d4115a1eec5688bfdc9bf34c5330a5296b212ebcdcc
src/content.js      4e8d0d81caba5e1701eb51657c5fe66653c462344d78b8238878d82da6c6969b
```

La seconde cohorte navigateur `.tools/m40-native-20261109-final-2/results.json` passe aussi les 11 contrôles du parcours et les **30 rendus PCM** : mortier et neuf SFX réparés, chacun actif/muet/volume nul. Les dix signaux actifs sont finis, non silencieux et non saturés ; les vingt cas muets/volume nul sont silencieux. Le wrapper observe puis appelle le vrai `connect` : coordonnées, rayon et retour `void` sont vérifiés, sans remplacer le graphe audio natif. Les 30 fichiers PCM sont conservés séparément ; cela ne constitue pas une écoute ou une appréciation artistique.

Cette cohorte finale confirme de nouveau zéro erreur page/console, zéro ressource en échec, les dix scripts et 38 ressources observés conformes au disque, quatre captures et un inventaire runtime inchangé avant/après. Le main GitHub a été recontrôlé après les essais : toujours `7fd6c46e7af57ae52de0efc7142314cae2ac0dc7`.

Empreintes SHA-256 des preuves acceptées :

```text
continuation-20261109-node-final-3/summary.json 908f2f19a60bd7c25e605a1a877274102e36b0dc68644dc16a7897ce259bc8eb
m40-native-20261109-final-2/results.json       e278d686862607b0625cbe0282b79bfb2181980354f5369eb1b3aaa4c4d65fb7
```

### Reproduction

```sh
node tools/qa-models.cjs
node tools/qa-model-detail.cjs
node tools/qa-organic.cjs
node tools/qa-mortar-lifecycle.cjs
node tools/qa-audio-boot.cjs
node tools/qa-boot-contract.cjs
python3 tools/serve.py --port 8098
# Dans un autre terminal, avec Playwright Python et Chromium :
python3 tools/qa-mortar-native.py --url http://127.0.0.1:8098/ --output .tools/m40-native-new-run
```

Choisir un dossier de preuve inexistant : le harness refuse d'écraser un essai précédent. `.tools/` est privé et ignoré par Git ; les scripts de reproduction et ce rapport sont versionnés.

## Hors lot

La bible/les Excel restent à fournir pour une conformité documentaire complète. Les autres chantiers, les représentations et animations 1:1, l'intégration de la PR documentaire #2, la publication Vercel et toute génération payante sont hors de ce commit technique. La montée au plafond, T140, le transport vers l'incinérateur, les autres morphologies, le HUD mobile et les occultations générales ne sont pas recertifiés par ce parcours M40.

Deux anciens SFX de saumure/géothermie utilisent encore des API audio inexistantes et restent muets ; ils n'ont pas été inclus dans cette réparation des neuf méthodes détachées. Aucun état de production Vercel n'est certifié ici et aucun push n'est effectué. Le checkout d'origine et le main distant restent inchangés ; seul le worktree dédié reçoit le commit.
