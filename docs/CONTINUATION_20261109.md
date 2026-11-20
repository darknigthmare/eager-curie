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

## Lot suivant autorisé — réconciliation complète de l'audit

Ce suivi prolonge le plan unique ci-dessus, après le commit `2be5405` et l'audit en lecture seule `.tools/alien-audit-20261109/audit-summary.json`. Les résultats du premier lot restent historiques et ne certifient pas les nouvelles modifications.

### Spécification et garde-fous

Le parcours cible est : menu/Codex → bibliothèque locale Alien Base à IDs stables → cycle biologique et interactions diégétiques → déplacement/IA/dangers → rendu et HUD utilisable. Les 494 fiches centrales et 29 œuvres sont des références, pas 494 nouvelles unités jouables. Le contenu biologique corrigé reprend la source épinglée `dd3d417b`/blob `21a4b3a` sans modifier les IDs ni les statistiques du catalogue. Aucune génération payante, publication ou modification de facturation n'est autorisée par ce lot.

La correction doit conserver les sauvegardes, le moteur récent et les preuves échouées ; ne pas fusionner l'ancienne branche `be04` en bloc. Les tailles sont comparées en unités du monde aux modèles humains existants, sans inventer une métrologie cinéma universelle. Les contrôles automatiques et les captures ne sont pas une QA humaine ni une certification 1:1.

### Tâches coordonnées

- [x] Porter les snapshots, le lecteur, la synchronisation et les neuf clarifications de caste ; intégrer le lien Codex sans spoiler ni fuite de pause.
- [x] Corriger la perception IA et sa mémoire de position, le routage de poursuite, la panique des dangers inactifs et le double update vapeur.
- [x] Replacer les props industriels par secteurs, avec limites, volumes, accès et progression cohérents ; interdire les interactions/chaînes sur les props inactifs.
- [x] Raccorder le modèle royal visible à la pose faciale, corriger les rapports d'échelle et le support/volume des mouvements au plafond.
- [x] Retirer le sélecteur QA donnant des soins gratuits ; conserver la continuité des mutations autorisées.
- [x] Compléter le détachement, réveil, découverte, fuite et relocalisation du même hôte, puis une émergence adulte progressive du cocon, au temps de simulation.
- [x] Dégager la scène sur mobile, garder les actions tactiles/clavier accessibles et intégrer les transitions visuelles sans masquer les contrôles.
- [x] Réparer les sorties audio encore muettes dans le périmètre audité, sans contourner le bus ni le réglage de volume.
- [x] Ajouter et exécuter les régressions sur les méthodes réelles ; geler les sources avant les parcours navigateur, collisions, rendu et PCM finaux.
- [x] Revoir le diff global, l'état distant et les preuves ; préparer le commit local validé et lister explicitement ce qui reste ouvert.

### Attribution et validation

Intégration, IA, props, créatures, cycle et HUD sont confiés à six agents avec des sous-sections disjointes. La coordination, l'audio et la validation globale restent à l'agent principal. Les nouveaux tests permanents vont dans `tools/`, les essais et captures privés dans `.tools/coherence-fix-20261109/`. Les essais natifs sur les nouvelles sources attendent le gel de tous les sous-lots ; les résultats seront ajoutés ici seulement après leur exécution.

### Changements réalisés dans ce second lot

La consultation documentaire est réconciliée sans fusionner l'ancien moteur : trois exports publics exacts, 494 références centrales et 29 notices média, liens depuis les seules castes déverrouillées du Codex. Les références et leurs notices `fidelityVerified:false` ne deviennent ni des unités ni des assets automatiquement. L'ancien libellé « quatre cartes » est remplacé par quatre origines dans une même station.

Les humains utilisent un champ de vision et une vraie ligne de vue, une position observée copiée qui expire après quatre secondes, puis une poursuite/recherche A*. Le chemin contrôle chaque arête et chaque segment lissé ; une grille fine bornée peut compléter la grille normale lorsqu'une ouverture réelle n'y est pas représentée. Le mixeur des personnages importés est avancé une fois par tick et respecte les propriétaires exclusifs des animations biologiques, T140 et transport. Cinq automatismes ne traitent plus une référence à la méthode `isSynthetic` comme un booléen vrai pour tous les humains. Les dégâts et portées chiffrés correspondants ne sont pas rééquilibrés.

Le placement industriel conserve les 300 IDs et leurs effets. Les volumes réels sont mesurés ; 29 anciens objets libèrent les liaisons, les portes et leurs cadres/colliders sont accordés aux ouvertures élargies. Huit pièces et 22 origines de circulation sont raccordées avec deux unités de dégagement adulte, ainsi que les 300 accès locaux. Les gros corps non testés ne sont pas couverts par ce dégagement. Le plan déterministe `src/industrial-layout.js` est précompilé et vérifié contre les factories ; un plan absent ou périmé est refusé explicitement, sans relancer une recherche lourde au démarrage. L'auteur reste reproductible avec `qa-level-coherence.cjs --author-layout`, puis `generate-industrial-layout.cjs --input=<preuve> --check`.

Les props et tourelles restent inactifs avant leur phase : ni collision fantôme, dégâts, munition consommée, interaction E/acide ni chaîne retardée invisible. Le collider propre de la tourelle ne masque plus sa cible ; les obstacles tiers continuent de bloquer. Le mortier reste réservé à la phase adulte, avec son délai de simulation et ses statistiques antérieures.

L'œuf est proportionné au torse du modèle humain existant. Le parasite normal et royal utilisent leur vrai modèle visible, une pose faciale repliée et une queue d'accroche ; le facteur royal intrinsèque est conservé. Après l'implantation : maintien, affaissement, chute du parasite mort, inconscience, réveil, découverte, panique, fondu, déplacement réel du même hôte vers une autre pièce et retour de l'image. Le cocon a une ouverture progressive de membrane/sutures/ligaments avant l'adulte, sans apparition instantanée. Les clics ne sautent pas les délais minimaux et les interruptions ne laissent pas de propriétaire d'animation périmé.

La revue des captures a ensuite corrigé un défaut non détecté par la seule ancre : les doigts pointaient vers l'extérieur et la queue descendait sur le thorax. Les huit doigts reviennent maintenant derrière la paume et une surface cervicale suit les vrais bindings cou/tête, avec géométrie réutilisée et mises à jour bornées. Le rig humain importé reçoit une défense articulée des deux bras, pas une demande de clip d'attaque absent qui retombait sur une pose immobile. Les vues natives de face et de profil sont examinées séparément des chiffres de collision.

La naissance utilisait aussi un juvénile trop grand, apparaissant dans un pilier depuis un point pourtant libre pour l'hôte. Son échelle propre devient `.50` : environ `1.161 × .646 × 3.190` unités, contre un humain de `4.25` ; le cocon `1.55`, les adultes et les stats ne changent pas. Un préflight compare le volume entier et une trajectoire thorax→sol, suivie d'une extraction de `.85` seconde verrouillée au contexte. Un passage bouché refuse la poussée sans consommer l'hôte ; un obstacle apparu en cours de sortie ne produit pas une téléportation. Les méthodes de déplacement et l'émergence réelles sont utilisées ensuite.

Q suit un chemin vers une jonction mur/poutre réellement construite, puis approche, alignement, montée et rotation jusqu'au contact du support mesuré. La prise T140 ajoute préparation, blessure unique au contact, hissage du même NPC, maintien et relâchement gravitaire. Un humain tué par les 140 dégâts reste un cadavre, pas un nouvel hôte. Si un obstacle condamne le sol de relâchement, un ancrage résine utilise la dernière pose encore valide et une descente Q peut se repositionner le long de la même poutre avant de tomber. Si cette dernière pose est elle-même invalidée, l'action explique son blocage au lieu d'inventer une sortie. Space conserve une chute sans poursuite automatique et des dégâts à l'atterrissage seulement.

Le transport lie le corps exact, limite la vitesse et vérifie son empreinte complète. La goulotte auparavant pleine devient une chambre creuse avec quatre parois et une trappe articulée dimensionnée au rig humain. Ouverture, levage, chargement, abaissement et fermeture durent 3,05 secondes de simulation ; pause, Q, changement de stage/mesh et reset nettoient les propriétaires. La consommation de l'acteur, sa sortie de la liste des hôtes et l'état de campagne sont engagés une seule fois, sans faux appel de dégâts sur un corps déjà neutralisé.

La profondeur de la chambre est corrigée après mesure du vrai personnage : `.986` unité d'épaisseur ne passait pas dans l'ancien seuil `.93`. Le rebord et la trappe sont à `1.95`, la profondeur utile déclarée à `1.75`, sans changer l'empreinte X/Z du plan. Le corps descend réellement au fond. L'interaction environnementale utilise **Espace**, pas E : le test et le prompt industriel annoncent maintenant la même commande, et le prompt n'annonce plus une action depuis un contexte incompatible ou derrière un obstacle.

Un anneau indicateur du raccord de refroidissement servait de point bas mais recevait une oscillation verticale de ±`.06`, faisant osciller le tuyau sous le sol. Son animation est désormais lumineuse, sans translation mécanique. Les positions, IDs, colliders, statistiques et plan précompilé restent identiques ; le défaut et sa correction sont mesurés sur les 300 objets en navigateur.

L'acte adulte ne propose plus de sélection de caste QA soignant gratuitement. Un humain blindé n'est pas une lignée biologique Warrior : la spécialisation Warrior consomme désormais un drone mature, avec son coût et sa durée précédents. T reste l'action caudale adulte, Maj+T le M314 ; la caméra et l'altitude du tracker suivent la position réelle. Le drawer mobile est fermé par défaut, ses actions principales restent tactiles, ses états `aria`/`inert` et sa fermeture lors d'une évolution sont synchronisés.

Les deux SFX saumure/géothermie encore muets du premier lot utilisent maintenant le vrai bus audio. La réduction momentanée du volume des explosions n'amplifie plus un réglage faible ou nul et une modification du volume/muet annule les anciennes restaurations programmées. Aucune piste musicale ou génération payante n'est ajoutée.

Les chemins de diffusion n'admettent sous `data/` que les trois exports examinés. Les documents, recherches, outils et preuves privés restent exclus ; la vérification HTTP Python et la politique locale d'upload sont distinctes d'une validation d'un déploiement Vercel. Le main distant et le checkout d'origine ne sont pas modifiés.

### Validation finale du second lot

La cohorte `.tools/coherence-fix-20261109/node-final-8/summary.json` passe ses **26 commandes**, avec inventaires du code et des 49 outils inchangés avant/après, `git diff --check` propre et **78 syntaxes** valides (57 JS/CJS/MJS, 21 Python). Seize suites à comptages explicites totalisent **303 cas/groupes/gabarits** : modèles 31, détails 18, organique 17, mortier 17, audio 31, démarrage 6, commandes 9, IA 43, navigation 8, niveau 17, créatures 33, cycle 26, transport 15, lignée RTS 5, HUD 19, modales Alien Base 8. Les fiches du catalogue, triangles, poses et points de chemin ne sont pas ajoutés à ce total comme des tests indépendants.

Les autres commandes valident l'intégrité du catalogue/lore/média, les deux synchronisations hors ligne, les chemins d'upload, le plan industriel byte-identique, 23 cas de classification stricte des origines HTTP/blob et 36 contrôles HTTP locaux réels. Les 13 tests unitaires `.ai-tools` sont des contrôles d'outillage distincts, pas une certification du jeu.

Neuf cohortes Chromium sur le même code final totalisent **135 contrôles**, hors les 36 PCM :

| Cohorte privée acceptée sous `.tools/coherence-fix-20261109/` | Contrôles |
| --- | ---: |
| `alien-native-final-4` — Archives, Codex, focus/pause, portrait/paysage | 13 |
| `world-native-6` — perception, vapeur, progression, géométrie et accès | 10 |
| `creature-native-3` — supports réels, Q/T140, chute, ownership/reset | 18 |
| `cycle/native-final-7` — hôte, naissance, cocon, royal visible | 20 |
| `transport/native-final-6` — saisie, déplacement, chambre, pause/Q/reset | 9 |
| `mortar-native-final-4` — fuse, esquive, destruction, contexte, mouvements réduits | 11 |
| `browser-final-4` — parcours UI, trois conclusions, clavier/mobile | 24 |
| `persistence-final-2` — données invalides, stockage refusé, reprise | 3 |
| `gameplay-royal-accepted-4` — règles de gameplay et défense royale préparée | 27 |

Les sources runtime de chaque cohorte sont inchangées et comparées au disque final. Les six parcours natifs spécialisés hachent les scripts servis et les ressources observées : 39 ressources par parcours de scène, jusqu'à 54 pour les Archives. Les 30 blobs de modèles sont reconnus uniquement lorsque leur origine intérieure est exactement celle du serveur local ; ils ne sont pas présentés comme de nouveaux fichiers HTTP. Aucune erreur page/console/ressource n'est relevée dans les cohortes acceptées. L'inventaire du test UI contient aussi son outil frère de persistance : celui-ci a été révisé ensuite, sans avoir été exécuté par la cohorte UI, puis validé par sa propre cohorte et par Node final-8. Cette distinction est consignée dans l'agrégat plutôt que de réécrire une ancienne preuve.

Les 300 accès natifs sont des appels A* depuis leurs origines locales explicites, avec contrôle des segments à `.8` ; ce ne sont pas 300 parcours joués. La suite Node vérifie séparément les 300 parcours à dégagement adulte `2`. Le contrôle natif des huit pièces et 22 origines ouvre **quatre portes réellement opérables** depuis des positions atteignables à distance ≤ 6, puis restaure leurs états. Il ne prétend pas que toutes les salles sont déjà accessibles lorsque ces portes sont fermées. Le correctif d'indicateur est aussi vérifié sur 300 objets × 9 instantanés en navigateur et 66 phases ciblées Node, sans en gonfler le comptage des contrats.

Le test de vapeur distingue les appels thermiques directs des dégâts acides réactifs : 8 côté joueur et 35 côté humain sur 60 expositions, plus 720 dégâts acides collatéraux réellement transférés, sans neutraliser cet effet ni repositionner les acteurs à chaque tick. La maturation royale utilise sa vraie durée de 20 s et le bonus de résine de 1,25 : 16 s mesurées, trois vagues réellement déclenchées, 13 renforts neutralisés par les méthodes réelles **comme préparation du test**, garde fermée puis ouverte. Cela ne constitue pas une victoire humaine jouée. Les trois conclusions vérifient aussi leurs gardes Mantis/Jansen, leurs titres et tons, épilogues et IDs sauvegardés.

Les 36 fichiers PCM sont séparés et leurs tailles/SHA-256 recontrôlés : douze méthodes actives produisent douze signaux distincts finis et non saturés, les 24 cas muets/volume nul sont silencieux. Ce rendu `OfflineAudioContext` n'est pas une écoute humaine. Les captures sont revues visuellement ; plusieurs utilisent une caméra diagnostique explicitement préparée, pas une preuve de lisibilité de tous les angles de jeu ou de performance GPU.

Les premières tentatives restent conservées : défauts réels de débordement/focus/clic thoracique, collision de fuite, taille/naissance, profondeur de chambre et ancrage au sol ; hypothèses d'observation corrigées ensuite (blobs locaux, queue cachée incluse dans Box3, dégâts acides mêlés à la vapeur, avatar absent en RTS, seuil d'arrivée `.3` alors que le contrôleur termine à `.5`, touche E utilisée à tort, préparations de renforts et titres de fins obsolètes). Une preuve échouée n'est jamais convertie en succès rétroactif. Les refus du sandbox avant lancement sont distingués des défauts de jeu.

Empreintes acceptées :

```text
src/game.js                         4bfd5fac52e367b574dcf6edea36de19da6a2f337657b09f16da25d1acabc2ff
src/models.js                       087301c6c1fa43fc79489fe30d08cc684858169c967efd42c2362e51333f7601
src/game-systems.js                  8867a7b0cc4271041a88c385848f67079465c00bd98619e555d1d20abd18bb7e
src/css/style.css                   f11bcad190f67d3fb0ee64559d215875af36347859fc78f7786909750ca9d37e
src/industrial-layout.js             ed6c1199866e3171f3d8633eff3ec3ed341fbd91b6c811a83a76cdc798f0cc60
node-final-8/summary.json             20db780a12e76134180ebd2c06033dd9a65f4721215807444d44e1839b35676c
accepted-summary.json                e74fe5d7b3c0d803ce078606a31ff10666ca777da7278d17c863330a8c31f62d
```

L'agrégat privé vérifie les résultats, le gel, les ressources et les empreintes réelles ; il n'est ni un manifeste Vercel ni une preuve de publication. Les scripts reproductibles sont versionnés, les données d'essai et PCM restent privés. Pour rejouer le lot, utiliser `node tools/qa-coherence.cjs --output .tools/<dossier-neuf>` puis les scripts `qa-*-native.py` avec `--url` et `--output` sur le serveur `tools/serve.py`. Les tests `qa-browser.py`, `qa-persistence.py` et `qa-gameplay.py` restent des parcours préparés distincts.

### Restants explicites et accès manquants

- Les formes adultes restent procédurales ; aucun asset AAA 2026, mocap, musique nouvelle ou génération payante n'est livré. La fidélité cinéma 1:1 n'est pas certifiée par les 494 fiches documentaires.
- Les poses de dépouille humaine et la manutention de l'alien sans IK de contact des mains restent à reprendre. Les vues de chambre montrent l'ouverture et la fermeture ; elles ne suffisent pas à certifier toute la gestuelle du corps chargé.
- L'ancrage T140 sous une barrière sans issue est validé comme **refus clair**, acteur unique persistant et nettoyage correct. `positiveResinRepositionCertified=false` : la sortie positive `DESCEND_POSITION` est testée en Node préparé, pas certifiée nativement dans ce cas complètement bouché.
- Toutes les morphologies, ennemis, anciennes actions et occultations ne sont pas certifiés. Le bond de traque K conserve notamment son ancienne relocalisation instantanée. La liste des types de menaces royales doit être généralisée aux nouveaux profils ; la préparation des 13 renforts du test ne prouve pas leur couverture exhaustive par cette liste.
- Les quatre origines partagent une station, pas quatre niveaux indépendants. L'éclairage, les proportions de toutes les autres formes, le mix musical et la lisibilité de chaque caméra restent des chantiers de direction artistique/QA spécifiques.
- Aucun classeur XLS/XLSX/ODS ni fichier explicitement nommé bible n'est présent dans les arbres main contrôlés. Les exports JSON et les CSV d'arsenal/recherche du registre sont disponibles, mais le lien/version exact du cahier de conception demandé reste nécessaire pour une conformité documentaire intégrale.
- Windows reste vérifié statiquement, pas exécuté nativement. Aucun benchmark GPU, déploiement, push, fusion de PR, changement Vercel ou modification de facturation n'est effectué. Les anciens SHAs et archives rejetés ne sont pas publiés.

Les mains distants vérifiés le 9 novembre restent `eager-curie@7fd6c46e7af57ae52de0efc7142314cae2ac0dc7` et `alien_base@c01c621a9e9b0adaf884f5dea09b09287dd945cf`. La livraison est un commit local sur le worktree dédié ; le checkout original et ses modifications éventuelles sont conservés.

## Reprise du 9 novembre — réconciliation locale et livraison immuable séparées

Après le commit local `898598c`, la demande de push/fusion a révélé un nouveau main : `bf6c12791b42faab94b0523d0d67a2e65e5cbc39`. Sa réconciliation est préparée dans le même worktree, sans remplacer le checkout d'origine. Les cartes SVG, nouveaux SFX/VFX, animations et comportements d'escouade sont conservés quand compatibles. Les échelles exprimées en mètres sans conversion du monde sont corrigées par rapport aux humains existants ; les nouvelles géométries du véhicule sont remappées dans sa réservation de station, sans prétention cinéma1:1.

Les conflits évitent de réintroduire les téléportations Q/T140, le transport sans collisions, l'écrasement de l'échelle royale ou l'altimétrie fictive. La géométrie des conduits reste indépendante de l'état du joueur pour les recherches IA. Les grenades concernées utilisent un impact figé et un délai de simulation, pas un callback visuel sensible aux mouvements réduits. Les ajouts d'animation conservent les propriétaires exclusifs ; la queue ne constitue pas une nouvelle chaîne vertébrale déformante. Les sélecteurs de cartes utilisent les vraies valeurs, un seul arrêt Tab par groupe et les touches fléchées/Home/End.

La suite `.tools/merge-20261109/node-4/summary.json` passe **29 commandes et82 syntaxes**, avec code et53 outils stables. Sept cohortes locales passent **100 contrôles natifs préparés** : World12, créatures18, cycle20, transport9, mortier11, gameplay27, persistance3. Les **57 PCM séparés** comportent19 signaux actifs distincts finis/non saturés et38 cas muets/volume nul silencieux. Les ressources réellement observées sont comparées au disque gelé. Cela ne valide ni les octets de `be04`, ni une publication, ni une QA humaine.

Le contrôle natif du nouveau menu est **non accepté** : six contrats passent, puis le bouton de campagne mesure40px en paysage844×390 au lieu du seuil44px. Les parcours UI suivants ne sont pas annoncés exécutés. Le défaut et les premiers essais restent intacts. L'agrégat `.tools/merge-20261109/local-summary.json` indique explicitement `releasePermitted:false`, malgré les suites positives. Les autres limites restent : occultation de T140 par HUD/sprite de dégâts dans sa caméra préparée, gestuelle de manutention non lisible dans les captures, sortie positive `DESCEND_POSITION` non certifiée, anciennes armes plasma/SADAR/phosphore encore dépendantes de callbacks visuels. Ni nouvelles morphologies complètes ni fidélité AAA ne sont déclarées.

La dernière consigne utilisateur remet la livraison **exclusive de `be04f89295be90bbee2351ece95c52257152f66e` sur Vercel** en priorité et demande de conserver main distant. Le push, la PR et la fusion distante sont donc suspendus ; la réconciliation locale n'est pas committée ni publiée. Aucun commit, branche ou archive rejeté n'a été envoyé à Vercel.

Pour cette seule livraison, le commit GitHub immuable est récupéré indépendamment : parent `be6239723a23ef693f7535af3a6390e7b7ecbb0a`, arbre `0e0b378f957cce86f75029f1fb3ec68fb7527b05`,96 fichiers autorisés et SHA256 `src/game.js` `dc730c6a1e7ddf056a1d401f2ba5bae9cbcfd2559181bff6c6eb5a6281834cbe` concordent. Les preuves historiques et le manifeste sérialisé original ne sont pas disponibles localement ; aucun réexamen de ces anciens tests n'est inventé. Le manifeste indépendant `release-preflight.json` reconstitue46 fichiers runtime et les34 références HTML, avec la racine en plus, soit35 vérifications HTTP prévues comme sur-ensemble.

L'alias contrôlé avant création reste sur `f15a56c5`/`dpl_4cKst2QC3aKppW6RvD2kWCepSv34`. Aucun déploiement du SHA autorisé n'existait. **Une seule demande** GitHub immuable, `withLatestCommit:false`, est acceptée pour le projet/équipe autorisés : `dpl_7uTapZ57E1zyxZnbNAN5jc9ujCUj`, target production, SHA `be04f892`. Au dernier relevé : **QUEUED**, donc ni READY, ni alias réassigné, ni comparaison HTTP de production réussie ne sont annoncés. Aucun HTTP402 n'est reçu sur cette demande. La veille existante est mise à jour pour réutiliser cette livraison sans doublon ; elle reste active jusqu'aux contrôles READY/alias/HTTP, sans changement de sa cadence, de la facturation ou de la file Vercel.

### Contrôle de production suivant — READY, validation HTTP partielle

Le relevé suivant du9novembre confirme `dpl_7uTapZ57E1zyxZnbNAN5jc9ujCUj` **READY**, production, SHA `be04f892` exact. L'alias `eager-curie.vercel.app` pointe sur ce déploiement, sans réassignation manuelle. Un agent indépendant rapproche aussi l'équipe, le projet et le dernier déploiement. Aucune nouvelle livraison n'est créée.

La connexion Vercel authentifiée retourne35 réponses publiques dont les tailles et SHA256 concordent avec les blobs Git immuables :34 références directes de l'HTML et la racine. Le hachage UTF-8 est contrôlé sur le vecteur SHA256 `abc`, l'HTML et le `game.js` complet, puis appliqué à toutes les réponses. Six chemins privés renvoient404 : `/.git/config`, `/.env`, `/README.md`, `/REMAINDER_20261101.md`, `/tools/qa-browser.py`, `/package.json`. Ces contrôles ne certifient pas un accès anonyme ni une exécution du jeu sur Vercel.

Deux vérifications supplémentaires restent **bloquées, pas validées** : `/AGENTS.md` et `/.tools/remainder-20261101/candidate-release-input-complete.json`. Le fetch d'AGENTS est explicitement refusé par le contrôle de risque, pour divulgation potentielle de consignes internes ; aucun contournement n'est tenté. Le réseau direct du workspace refuse l'hôte Vercel par CONNECT403 au proxy, sans réponse de l'application. La clôture demande l'autorisation réseau de cet hôte et des requêtes HEAD limitées aux statuts, sans lire de contenu. Les preuves partielles et refus sont conservés dans `.tools/production-check-20261109-1/http-authenticated.json`.

La veille est **suspendue pour intervention d'accès**, conformément à la consigne ; ce n'est pas un arrêt pour validation complète. Main distant, code local et preuves antérieures restent préservés. Les agents du lot suivant ont seulement préparé deux corrections bornées : bouton paysage44px et sprites `floatingText` mesurés/bornés. Ils n'ont rien modifié. Leur inspection précise que l'occultation majeure de T140 dans l'ancien PNG vient d'abord d'une caméra diagnostique très proche ; elle ne prouve pas un défaut de la caméra joueur normale. Le défaut VFX réel restant est la texture fixe256×96 et la taille monde non plafonnée en pixels.

## Correctifs P0 du 20 novembre 2026

- Le prologue conserve la sauvegarde précédente jusqu'à la confirmation du départ. Reprendre restaure l'origine, la variante royale et le bon hôte. Le tirage aléatoire du premier acte est enregistré et les anciennes sauvegardes sans origine résolue reprennent au vaisseau.
- Les projectiles humains et extraterrestres éprouvés déclenchent leurs impacts au temps de simulation. La pause fige le délai et l'impact reste au point visé. Remplacer l'acte retire les tirs en attente, les nappes de phosphore ou d'acide et les grenades EMP en vol. Les délais Boiler et Carrier suivent la même horloge. Le recul vérifie les collisions.
- Les flaques acides gardent leurs dégâts, leur durée et leurs interactions avec les barbelés et les tourelles avec les mouvements réduits. La vapeur garde son effet de couverture avec un rendu fixe.
- Les actions tactiles du menu et du prologue mesurent au moins 44 × 44 pixels CSS. Les textes de combat utilisent une texture mesurée et une taille plafonnée sur l'écran. Le test T140 a vérifié le libellé sous la caméra de jeu dans une scène préparée.

Les preuves du code gelé sont sous `.tools/p0-20261120/`. La suite `node-final-2` valide 30 commandes et 85 fichiers de syntaxe JS ou Python. `combat-native-4`, `human-native-final`, `floating-text-acid-final-1`, `menu-final` et `mortar-final` valident respectivement 8, 14, 5, 12 et 11 contrôles Chromium. Le mortier fournit également 57 rendus PCM. `gameplay-final` rejoue 27 régressions, et `persistence-final` couvre les reprises et la conservation des sauvegardes. Les essais précédents avec échec ou changement d'empreinte sont conservés dans leurs propres dossiers.

La lecture du 20 novembre confirme que Vercel sert `be04f892` via `dpl_7uTapZ57E1zyxZnbNAN5jc9ujCUj`. Les deux statuts sur les chemins privés de production restent à vérifier avec un accès autorisé. La suite ci-dessous reprend la gestuelle, les occultations de T140 et la sortie alternative `DESCEND_POSITION`.

## Suite des commandes et de la progression du 20 novembre 2026

Le lot P0 validé a été commité et poussé sur `codex/bible-continuation-20261109` sous `697e4be`. Le relevé GitHub donne `main@6b99ba0`. L'audit statique de cette refonte retrouve les anciens déplacements instantanés pour K et Q, ainsi que la liste partielle des menaces royales. La réconciliation des six fichiers modifiés sur les deux branches reste distincte de ce lot.

- **Bond K**. Le contrôleur prépare un arc et vérifie le gabarit animé à chaque étape. La cible peut sortir de la zone d'impact. Les dégâts se déclenchent à la réception. Un obstacle ajouté pendant le vol ramène l'acteur au dernier point au sol validé. Le piratage conserve la priorité à proximité d'un terminal.
- **Trajet de mue**. Le déplacement au clic termine chaque segment avec une tolérance de 0,02 unité. Le scénario Chromium vérifie un clic à 0,35 unité puis l'arrivée sur un site permettant l'extraction adulte de 2,4 unités.
- **Capture T140**. Dans la caméra de jeu, la poutre qui empêchait de voir les deux silhouettes devient translucide pendant la capture. Son volume de collision reste actif. Le chiffre de dégâts s'affiche une fois. Le test Q couvre aussi une descente alternative près d'un obstacle, sans captive dans ce scénario. Le scénario séparé avec captive et passage condamné conserve un refus sûr.
- **Cycle royal**. La garde de progression utilise le même prédicat que l'IA. Le dernier Taser suffit à retenir la maturation. Les points d'apparition vérifient le dégagement et l'espacement. Dans le parcours complet, l'ingénieur auparavant isolé dispose d'une route vers un point de ralliement proche du joueur dont la position exacte est bloquée pour le gabarit du renfort. Le test vérifie le sol pour les 19 apparitions et les segments des 15 approches de renfort.
- **Incinérateur**. Le bouton Q et son raccourci tactile indiquent la phase de chargement à annuler. Le libellé plafond revient quand la main est rendue au joueur.

Les résultats finaux de `.tools/continuation-20261120/` couvrent 30 suites Node et 86 vérifications de syntaxe (`node-rally-verified`), puis 31 régressions de campagne, 21 contrôles biologiques, 10 pour l'incinérateur et 6 pour le bond. Le cycle royal isolé ajoute un rejeu ciblé de 10 contrôles. T140 fournit 20 contrôles et 17 captures dans `.tools/t140-20261120/gameplay-camera-geometry-final/`. Les rapports contrôlent les empreintes avant et après les tests. Les échecs de ralliement (`gameplay-final`, `gameplay-rally-final`) et le dépassement du délai du bond sous exécution concurrente (`prowl-rally-final`) restent dans leurs dossiers.

La liaison anatomique du dard à la captive pendant tout le hissage et l'occultation du joueur par les poutres après retour au sol restent ouvertes. Les essais emploient le moteur et les commandes réels dans des scènes préparées. Il reste à éprouver toutes les positions de portes, les morphologies et un parcours humain complet.
