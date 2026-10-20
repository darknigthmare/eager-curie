# Refonte graphique — vérification du 20 octobre 2026

La refonte conserve des modèles procéduraux stylisés. Elle améliore les silhouettes et les matériaux des créatures, humains, accessoires et décors. Elle ne constitue pas une reproduction photoréaliste ou une correspondance « 1:1 » validée avec des modèles ou images de référence.

## Modifications visibles

- **Créatures :** dôme lisse allongé du Drone, crâne côtelé du Warrior, posture quadrupède du Runner et couronne de Reine placée sur le crâne. Anatomie adulte affinée, jambes digitigrades, queue vertébrée effilée, mâchoire interne rétractée au repos et animée pendant l'attaque. Œuf, Facehugger et juvénile sont également détaillés.
- **Humains :** volumes continus du torse, du bassin et des membres ; vêtements, visages, doigts, gants et protections différenciés. Les scientifiques et civils ne portent plus systématiquement un casque militaire. Le Powerloader conserve son identité de machine.
- **Matériaux :** 22 cartes locales de 1024×1024, avec couleur, normales, rugosité, occlusion et métal selon le matériau. L'usure industrielle a été atténuée après inspection des captures pour éviter un sol scintillant ou couvert de bruit.
- **Station :** 2 727 éléments de décor regroupés en 18 lots au niveau élevé et 9 au niveau bas : conduites, cadres, aérations, éclairages, grilles et marquages. Ces détails n'ajoutent aucun obstacle de navigation.
- **Rendu :** éclairage physique, environnement de réflexion local filtré, rendu HDR linéaire lorsque disponible, conversion ACES/sRGB appliquée une fois, ombres, contacts par profondeur et bloom limité. Les profils automatique, équilibré, élevé et ultra sont disponibles et mémorisés dans les réglages. Le profil mobile désactive les contacts par profondeur et réduit la résolution et les ombres.

## Comparaison contrôlée

Les captures avant/après des actes IV et V utilisent les mêmes positions de caméra, cibles et champs de vision, en 1440×900 et 390×844. La simulation reste figée ; une boucle de rendu dédiée conserve le contenu WebGL pendant la capture. Les galeries présentent les mêmes catégories et cadrent chaque modèle selon ses dimensions. Une capture supplémentaire montre la nouvelle caméra de jeu, plus proche, avec le HUD.

Les fichiers de preuve sont générés sous `.tools/graphics/` et ne sont pas publiés avec le jeu :

- `before/` : quatre vues de jeu et trois galeries ;
- `after/` : quatre vues correspondantes, une vue avec la nouvelle caméra et trois galeries ;
- `before/diagnostics.json` et `after/diagnostics.json` : compteurs, échantillons temporels, empreintes des scripts et résultats des contrôles.

Les huit images finales ont été inspectées. Le contrôle automatique du centre de l'image, en dehors des panneaux principaux, rejette une capture où le monde est noir. Toutes les vues finales dépassent 95,4 % de pixels non noirs dans cette région. Les sept scripts servis correspondent aux empreintes des fichiers finaux du dépôt.

## Coût géométrique mesuré

Ces compteurs proviennent de la passe de scène avant les quatre passes supplémentaires de post-traitement. Le cadrage est identique dans chaque paire.

| Vue | Appels de dessin avant → après | Triangles avant → après |
| --- | ---: | ---: |
| Acte IV, 1440×900 | 192 → 96 | 15 911 → 76 360 |
| Acte V, 1440×900 | 1 162 → 602 | 120 400 → 448 484 |
| Acte IV, 390×844 | 154 → 60 | 14 561 → 48 690 |
| Acte V, 390×844 | 492 → 360 | 47 003 → 186 562 |

La densité géométrique augmente pour les formes détaillées. Le regroupement des petits éléments réduit les appels de dessin ; ces deux mesures ne permettent pas, seules, de conclure à un gain de fréquence d'images.

Les échantillons de rendu utilisent Chromium avec **SwiftShader, un moteur logiciel**, et `gl.finish()`. Médianes de trois échantillons, en millisecondes :

| Vue | Avant | Après |
| --- | ---: | ---: |
| Acte IV, 1440×900 | 3,2 | 1,0 |
| Acte V, 1440×900 | 445,4 | 408,5 |
| Acte IV, 390×844 | 1,5 | 0,9 |
| Acte V, 390×844 | 6,9 | 4,1 |

Ces échantillons sont très variables : l'acte V final va de 30,7 à 895,4 ms. Il s'agit de diagnostics de cette machine, sans mesure de performances sur une carte graphique réelle ni garantie de FPS sur téléphone.

## Contrôles effectués

`tools/qa-graphics.py` termine avec **quatre groupes de contrôles réussis** :

1. Initialisation des cinq actes avec les ressources graphiques finales.
2. Deux cycles mobile/élevé/ultra et redimensionnements : nombre de ressources stable à 239 géométries et 47 textures pour la scène de contrôle.
3. Libération du post-traitement : retour à 238 géométries et 43 textures ; un second appel de nettoyage reste sûr.
4. Sélection des quatre profils par les vrais contrôles de réglages, restauration d'ultra après rechargement et récupération d'un ancien réglage invalide. Le mode automatique passe au profil mobile en 390×844, avec une cible de rendu de 331×717, puis au profil élevé en 1440×900. La taille CSS du canvas correspond exactement au viewport.

Les 22 textures sont chargées avant les captures. Aucun appel réseau externe, aucune ressource locale en échec, aucune erreur JavaScript non interceptée et aucune erreur de console ne sont observés dans cette exécution.

Les suites complémentaires couvrent les signatures et CRC PNG, les raccords, les cartes scalaires, les normales et la régénération déterministe des 22 cartes ; 31 cas de fabrique de modèles ; 24 variantes de rig et de géométrie ; 18 contrôles de détails humains et 15 contrôles du pipeline de rendu. Les régressions de campagne et de sauvegarde sont décrites dans `QA_REPORT.md`.

## Reproduire les diagnostics finaux

Les outils graphiques nécessitent Python, Playwright, Pillow et Chromium. Ces dépendances ne sont pas nécessaires pour jouer.

```bash
python3 tools/serve.py --port 8082
# Depuis un second terminal, à la racine du dépôt :
python3 tools/qa-graphics.py --url http://127.0.0.1:8082/ --label after
python3 tools/qa-render.py
python3 tools/qa-textures.py --regenerate
node tools/qa-models.cjs
node tools/qa-model-detail.cjs
```

L'outil graphique ajoute uniquement un accès de diagnostic aux objets internes du moteur dans la réponse de `game.js`. Il transmet les autres scripts sans modification, puis vérifie leurs empreintes. Les ressources de production restent les fichiers du dépôt. Cette revue automatisée et visuelle par agents ne remplace pas une session de jeu humaine ni des essais sur des appareils physiques.
