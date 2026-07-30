# HIVE ASCENSION

Jeu de survie et de stratégie biologique en cinq actes, jouable dans un navigateur. La campagne originale « Les Archives de MNEMOSYNE » suit le cycle complet de la Ruche, de l’Ovomorphe à la Reine, puis propose trois conclusions.

[Jouer en production](https://eager-curie.vercel.app) · [Dépôt GitHub](https://github.com/darknigthmare/eager-curie)

## Contenu

- Prologue, cinq actes, objectifs suivis et trois fins.
- Ovomorphe, Facehugger, Chestburster, Drone, Runner, Warrior, Worker, Spitter, Praetorian et Reine.
- Hôtes différenciés, soldats, synthétiques, exosquelettes et boss à phases.
- Modèles 3D procéduraux détaillés, décors industriels, résine, éclairage, SFX et VFX.
- Codex, sauvegarde locale, difficulté, pause, son, contraste élevé et réduction des mouvements.
- Textures originales générées localement et reproductibles avec `tools/generate-textures.mjs`.

Le catalogue narratif et les règles biologiques sont centralisés dans `src/content.js`. L’audit de contenu et de cohérence se trouve dans `GAME_AUDIT.md`.

## Lancement sous Windows

Double-cliquez sur `start.bat`, puis ouvrez `http://localhost:8080/`.

Pour choisir un autre port ou ne pas ouvrir le navigateur :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\server.ps1 -Port 8090 -NoBrowser
```

Le serveur n’écoute que sur la machine locale et exclut les fichiers privés et scripts de lancement.

## Contrôles

- Déplacement : `ZQSD`, `WASD`, flèches, clic ou toucher sur le terrain.
- Visions : `F1`, `F2`, `F3`.
- Actions contextuelles : boutons à l’écran ou raccourcis indiqués dans chaque acte.
- Codex : `C`.
- Pause : `Échap`.
- Ruche : ordres synaptiques et création de castes depuis la barre d’actions.

## Architecture

`index.html` charge, dans l’ordre :

- `src/content.js` : narration, castes, ennemis, boss, codex et fins ;
- `src/models.js` : modèles 3D procéduraux et matériaux ;
- `src/game-systems.js` : sauvegarde, réglages, VFX et interfaces ;
- `src/game.js` : moteur Three.js et cinq actes jouables.

Three.js r128 et les polices sont chargés depuis des CDN. Une erreur lisible est affichée lorsque WebGL ou la dépendance réseau est indisponible.

> Ce dépôt n’est pas le projet SNL sous Unreal Engine 5.7 : il ne contient ni `.uproject`, ni Blueprint, ni réplication multijoueur.
