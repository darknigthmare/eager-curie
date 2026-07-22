# HIVE ASCENSION

Prototype de jeu solo Three.js jouable dans un navigateur. La version exécutée par `index.html` se trouve dans `src/game.js`.

> Ce dépôt n'est pas le projet SNL sous Unreal Engine 5.7 : il ne contient ni `.uproject`, ni Blueprints, ni réplication multijoueur, et son univers est HIVE ASCENSION plutôt que Stargate.

## Lancement sous Windows

Double-cliquez sur `start.bat`, puis ouvrez `http://localhost:8080/` si le navigateur ne s'ouvre pas automatiquement.

Pour choisir un autre port ou ne pas ouvrir le navigateur :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\server.ps1 -Port 8090 -NoBrowser
```

Le serveur n'écoute que sur la machine locale et ne sert pas les fichiers privés ou les scripts de lancement.

## Contrôles

- Déplacement : `ZQSD`, `WASD`, flèches, clic ou toucher sur le terrain.
- Visions : `F1`, `F2`, `F3`.
- Facehugger et métamorphose : `Espace` lorsque l'action est disponible.
- Drone : `1`/`E` pour l'acide, `2`/`R` pour la queue, `3`/`F` pour le cocon.
- RTS : `Q`, `W`, `E`, `R` pour les ordres et `P` pour la possession directe.

## Dépendances

Three.js r128 et les polices sont chargés depuis des CDN. Si Three.js ou WebGL est indisponible, l'interface affiche désormais une erreur et propose de recharger le jeu.

Les autres fichiers modulaires sous `src/engine`, `src/entities`, `src/environment`, `src/stages` et `src/systems` sont un prototype antérieur non chargé par la page actuelle.
