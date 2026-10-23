# HIVE ASCENSION

Jeu de survie et de stratégie biologique en cinq actes, jouable dans un navigateur. La campagne originale « Les Archives de MNEMOSYNE » suit le cycle complet de la Ruche, de l’Ovomorphe à la Reine, puis propose trois conclusions.

[Jouer en production](https://eager-curie.vercel.app) · [Dépôt GitHub](https://github.com/darknigthmare/eager-curie)

## Contenu

- Prologue, cinq actes, objectifs suivis et trois fins.
- Ovomorphe, Facehugger, Chestburster, Drone, Runner, Warrior, Worker, Spitter, Praetorian et Reine.
- Hôtes différenciés, soldats, synthétiques, exosquelettes et boss à phases.
- Créatures 3D procédurales, humains texturés et squelettés, décors industriels, résine, éclairage, SFX et VFX.
- Codex, sauvegarde locale, difficulté, pause, son, contraste élevé et réduction des mouvements.
- Textures originales générées localement et reproductibles avec `tools/generate-textures.mjs`.
- Surfaces anatomiques continues, matériaux PBR jusqu’à 2048 px, décor industriel instancié et reflets d’environnement.

Le catalogue narratif et les règles biologiques sont centralisés dans `src/content.js`. L’audit de contenu et de cohérence se trouve dans `GAME_AUDIT.md`.

## Cycle biologique jouable

- L’Ovomorphe commence fermé, puis son ouverture est animée après l’arrivée réelle de l’hôte.
- Le stimulus et les destinations données au clic utilisent une navigation A* pour contourner les cloisons.
- Le Facehugger, redimensionné, bondit jusqu’au visage, s’ancre sur un point facial et adopte une pose repliée.
- La gestation reste invisible de l’extérieur : l’hôte se réveille et continue de se déplacer jusqu’à la maturation.
- La maturation bascule vers une vue thoracique plein écran ; la perforation du sternum est animée avant le retour à la caméra normale.
- Le juvénile chasse et mord physiquement de petites souris, puis forme un cocon agrandi et pulsant.
- Les déplacements et attaques utilisent des animations procédurales, des projectiles visibles, des VFX et des SFX spatialisés.
- La sauvegarde conserve la continuité de l’acte, de la caste et de l’hôte utilisé.

## Lancement sous Windows

Double-cliquez sur `start.bat`, puis ouvrez `http://localhost:8080/`.

Pour choisir un autre port ou ne pas ouvrir le navigateur :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\server.ps1 -Port 8090 -NoBrowser
```

Le serveur n’écoute que sur la machine locale et exclut les fichiers privés et scripts de lancement.

## Lancement sous Linux, macOS et dans le cloud

Python 3.9 ou ultérieur suffit. Depuis la racine du dépôt :

```sh
python3 tools/serve.py
```

Le port par défaut est 8080 ; `--port 8090` permet de le changer. Ce serveur reste sur l’interface locale, applique les en-têtes de sécurité Vercel et exclut les fichiers privés et les outils de développement.

Aucune compilation, installation npm, clé API ou base de données n’est nécessaire. Le moteur Three.js r128 et les polices sont inclus dans `assets/`, avec leurs licences. La page de jeu ne dépend d’aucun CDN.

## Vérifications QA

Avec Python Playwright et Chromium installés, démarrer `python3 tools/serve.py --port 8082`, puis exécuter :

```sh
python3 tools/qa-browser.py --url http://127.0.0.1:8082/
python3 tools/qa-persistence.py --url http://127.0.0.1:8082/
python3 tools/qa-gameplay.py --url http://127.0.0.1:8082/
node tools/qa-models.cjs
```

Le premier script produit son rapport JSON et ses captures dans `.tools/qa/`. Les tests automatisés couvrent des parcours d’interface et des scénarios ciblés ; l’initialisation des actes par API ne constitue pas une campagne intégralement jouée. Les résultats et limites sont décrits dans `QA_REPORT.md`.

Pour renouveler les dépendances statiques épinglées : `python3 tools/vendor-assets.py`. Cet outil vérifie l’intégrité SHA-512 des archives npm avant d’écrire les fichiers ; `assets/vendor/provenance.json` enregistre leurs versions et empreintes.

## Qualité graphique

Les paramètres du jeu proposent Automatique, Équilibré, Élevé et Ultra. Le choix est conservé après rechargement. Les textures restent détaillées dans tous les modes ; les profils ajustent la résolution de rendu, les ombres et les effets. Automatique privilégie le profil Équilibré sur une interface tactile ou un petit écran.

Les cinq familles de matériaux — carapace, résine, métal industriel, tissu et peau — disposent de cartes couleur, normales, rugosité et occlusion. Le métal dispose aussi d’une carte métallique. Les 22 cartes sont locales : carapace et peau en 2048 × 2048, autres matériaux en 1024 × 1024. Les crânes, torses, ventres et membres utilisent des profils sculptés continus ; les plis des vêtements et les traits du visage sont modelés dans la géométrie. Une finition de surface ajoute de fines variations de relief et de rugosité aux cartes PBR. Les reflets filtrés, les contacts par profondeur et le bloom discret complètent l’éclairage ; les cloisons devant la créature restent transparentes.

La molette et le réglage « Distance de caméra » permettent de rapprocher la vue de suivi de 50 à 135 %. Ce choix est conservé après rechargement ; la vue stratégique de la Ruche et les séquences cinématiques conservent leur cadrage.

Les personnages humains utilisent deux avatars Microsoft Rocketbox sous MIT, avec textures intégrées et animations squelettiques de repos, marche et course. Les rôles de combat conservent leurs armes, attachées à la main animée. Les autres formes biologiques et l’exosquelette restent procéduraux. Les fichiers GLB sont servis localement et préchargés avant le démarrage ; aucune connexion à Meshy n’est nécessaire pour jouer. Les modèles et leurs sources, licences et empreintes se trouvent dans `assets/models/`.

Un environnement HDR d’entrepôt Poly Haven sous CC0 fournit les reflets filtrés. Sa provenance est conservée dans `assets/environments/`. Les cadres chanfreinés, grilles épaisses et éléments de maintenance enrichissent la station.

Pour reproduire les contrôles graphiques (les scripts de captures utilisent aussi Pillow) :

```sh
node tools/qa-model-detail.cjs
node tools/qa-organic.cjs
python3 tools/qa-surface.py
python3 tools/qa-textures.py --regenerate
python3 tools/qa-render.py
python3 tools/qa-assets.py --url http://127.0.0.1:8082/
python3 tools/qa-environment.py --url http://127.0.0.1:8082/
python3 tools/vendor-models.py --verify
python3 tools/qa-graphics.py --url http://127.0.0.1:8082/ --portraits --matched-inspection --require-assets --require-hdr
```

Les tests Node des modèles vérifient les géométries procédurales de secours. `qa-assets.py` vérifie les vrais imports, le skinning, les animations et la destruction ; `--require-assets --require-hdr` refuse une capture qui utiliserait silencieusement les ressources de secours.

Le contrôle des textures vérifie notamment l’intégrité PNG, les coutures et une régénération identique. Les derniers gros plans, imports et budgets figurent dans `MODERN_ASSETS.md`. `SCULPT_UPGRADE.md` et `GRAPHICS_UPGRADE.md` décrivent les passes précédentes. Les mesures sous WebGL logiciel ne sont pas des mesures de fréquence d’image sur un GPU de jeu.

## Contrôles

- Déplacement : `ZQSD`, `WASD`, flèches, clic ou toucher sur le terrain.
- Visions : `F1`, `F2`, `F3`.
- Actions contextuelles : boutons à l’écran ou raccourcis indiqués dans chaque acte.
- Codex : `C`.
- Pause : `Échap`.
- Distance de caméra : molette ou curseur dans les réglages (hors vue stratégique).
- Ruche : ordres synaptiques et création de castes depuis la barre d’actions.

## Architecture

`index.html` charge, dans l’ordre :

- `src/content.js` : narration, castes, ennemis, boss, codex et fins ;
- `src/organic-sculpt.js` : surfaces anatomiques continues et gabarits de géométrie ;
- `src/surface-detail.js` : finition des matériaux PBR ;
- `src/model-detail.js` : visages, vêtements et accessoires ;
- `src/asset-library.js` : chargement glTF local, instances squelettiques et animations ;
- `src/models.js` : fabriques de modèles 3D et matériaux ;
- `src/render-quality.js` et `src/station-detail.js` : profils de rendu et détails de station ;
- `src/game-systems.js` : sauvegarde, réglages, VFX et interfaces ;
- `src/game.js` : moteur Three.js et cinq actes jouables.

Three.js r128 et les polices sont servis localement. Une erreur lisible est affichée lorsque WebGL est indisponible.

> Ce dépôt n’est pas le projet SNL sous Unreal Engine 5.7 : il ne contient ni `.uproject`, ni Blueprint, ni réplication multijoueur.
