# Assets importés et éclairage HDR — 20 octobre 2026

Cette passe part de la version `a7d0660`. Elle remplace une partie des personnages procéduraux par des modèles glTF locaux et ajoute un environnement HDR capturé. Le chargement d'un fichier glTF, son apparence, son animation et son intégration dans le jeu sont vérifiés séparément. Le format GLB ne suffit pas, à lui seul, à garantir une qualité visuelle ou une époque de création.

## Contenu réellement intégré

Deux avatars Microsoft Rocketbox sous licence MIT sont convertis en glTF 2.0 et servis localement, avec textures intégrées. Le manifeste réutilise ces deux modèles pour les différents rôles humains ; il ne contient pas quatorze silhouettes distinctes. Les rôles armés conservent leur équipement, attaché à la main du squelette. Les sources et la licence sont épinglées au commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9` dans `assets/models/rocketbox/provenance.json`.

| Avatar | Fichier GLB | Triangles de l'asset | Primitives / SkinnedMesh | Os | Clips |
| --- | ---: | ---: | ---: | ---: | --- |
| Medical Male 01 | 5 734 080 octets | 7 581 | 3 | 80 | Idle, Walk, Run |
| Military Male 01 | 11 677 056 octets | 15 387 | 5 | 80 | Idle, Walk, Run |

Les animations sont converties depuis les clips source, avec déplacement horizontal retiré pour laisser le jeu gérer la translation. Aucun clip d'attaque ou de mort n'est fourni : une attaque conserve la locomotion disponible. Le test ne présente pas ce comportement comme une animation d'attaque importée. Les deux GLB représentent ensemble 17 411 136 octets avant compression HTTP.

L'environnement est le HDR capturé « Empty Warehouse 01 » de Poly Haven, sous CC0, conservé en Radiance RGBE 1024×512 : 1 672 140 octets. Sa provenance épinglée et son SHA-256 sont enregistrés dans `assets/environments/provenance.json`. La radiance reçoit une calibration de −2 EV avant le filtrage PMREM, après qu'une première inspection a révélé une scène trop délavée. Le fichier source reste identique. Le runtime fabrique une PMREM partagée de 768×768, soit 2 359 296 octets pour le tampon RGBA observé ; ce chiffre n'inclut pas l'ensemble de la mémoire du rendu.

Les créatures, les formes larvaires, les animaux de laboratoire et l'exosquelette restent procéduraux. Aucun GLB de créature Meshy n'a été produit ni intégré pendant cette passe. Le travail ne réalise donc pas une conversion de tous les personnages en assets contemporains.

L'accès à l'API Meshy reste bloqué par la politique réseau cloud. La configuration correspondante existe en brouillon et n'est pas appliquée. Aucun crédit Meshy n'a été dépensé ; le plafond approuvé de 50 reste retenu pour la suite. La créature détaillée demandée et la reproduction « 1:1 » des références restent à réaliser.

Le décor reçoit des panneaux en retrait, des couronnes de cloisons, des ventilateurs et coffrets de service, des conduites avec coudes, des grilles de sol et des raccords. Les pièces répétées sont regroupées en instances et suivent la visibilité des murs. Ces ajouts sont construits dans le code ; ils ne proviennent pas d'un pack de station importé.

## Référence visuelle

La référence provient d'une archive Git isolée dans `/tmp/hive-modern-baseline`, sans worktree, avec 87 fichiers placés en lecture seule. Un manifeste séparé enregistre l'empreinte SHA-256 de l'archive et de chaque fichier. La vérification après capture confirme que ces fichiers correspondent toujours au commit `a7d066020b8880776d8cb573277acf60697a65b5`.

Six captures sont conservées dans `.tools/modern/before/` : Drone de trois quarts et de profil, scientifique de corps et de visage, puis scène en jeu en 1440×900 et 390×844. Les quatre portraits occupent au moins 79,3 % de la hauteur de l'image. Le passage ne relève aucune exception JavaScript, erreur console, ressource locale échouée ou requête externe. Il constitue une référence visuelle, sans validation d'une campagne complète.

## Méthode de validation des imports

Le contrôle graphique attend la promesse de chargement des textures, celle des modèles importés et celle du HDR. Avec `--require-assets`, il refuse les imports manquants et les fallbacks enregistrés. Avec `--require-hdr`, il exige une PMREM chargée et effectivement appliquée à la scène.

Les gros plans humains utilisent l'ancre faciale ou l'os de tête de la véritable instance skinnée. Dans les portraits, la boîte du corps provient des sommets déformés par le squelette ; une boîte de repos ne peut donc pas masquer une mauvaise posture. Lorsqu'un gros plan de référence est disponible, ses coordonnées de caméra, sa cible et son champ de vision sont réutilisés exactement.

Le studio utilise `environment:false` et conserve son éclairage neutre identique pour comparer les modèles. Les scènes en jeu utilisent le HDR réel. Les images gardent une boucle de rendu dédiée pendant la composition, avec simulation et caméra fixes, et un contrôle de pixels rejette les captures de monde noir. Les empreintes des scripts servis sont comparées aux fichiers du dépôt avant toute validation finale.

L'ancienne suite de détails procéduraux vérifie des noms de primitives et leurs rattachements. Ses résultats ne constituent pas une preuve du chargement de GLB. Les contrôles d'imports doivent examiner les instances du parcours normal, les os, les `SkinnedMesh`, les clips réellement lus, la déformation de sommets, l'indépendance de deux clones et leur destruction. Les échecs de chargement doivent produire un diagnostic explicite.

## Reproduire

Les outils de QA facultatifs nécessitent Python, Playwright, Pillow et Chromium ; ils ne sont pas requis pour jouer.

```bash
python3 tools/serve.py --port 8082
# Dans un second terminal, depuis la racine du dépôt :
python3 tools/qa-graphics.py --url http://127.0.0.1:8082/ --label after --output .tools/modern --portraits --matched-inspection --require-assets --require-hdr
```

Pour reprendre uniquement les portraits, utiliser `--portraits-only --portrait-subjects drone,scientist`. Une reprise ciblée peut employer `--portrait-frames face --merge-diagnostics` ; la fusion est refusée si les empreintes des scripts diffèrent.

## État des preuves

Le passage définitif termine avec un code de sortie 0 : 26 captures, trois galeries, 14 portraits et cinq groupes fonctionnels validés. Les portraits occupent entre 79,3 et 90 % de la hauteur. Les six portraits humains enregistrent des instances importées, avec 80 os et les trois clips annoncés ; leur Idle est posé à 0,6 seconde pour la capture. Le gros plan scientifique reprend exactement la caméra, la cible et le champ de vision du baseline.

Les cinq groupes contrôlent :

1. L'initialisation native des cinq actes avec des acteurs et positions valides. Il s'agit de chargements de scènes, pas d'une campagne jouée intégralement.
2. Deux cycles mobile/high/ultra avec redimensionnement et ressources stables : 194 géométries et 94 textures sur la scène de contrôle.
3. La destruction répétée du post-traitement, avec libération d'une géométrie et de cinq textures.
4. Les réglages graphiques dans le DOM, la restauration d'ultra, la récupération d'une ancienne valeur invalide et le profil auto entre les deux dimensions d'écran.
5. Le vrai curseur et la molette de distance, leurs bornes 50/135, la pause et les gardes de cinématique/RTS, la persistance et la normalisation des valeurs de stockage invalides.

Les dix scripts servis et les quatre ressources chargées — manifeste, deux GLB et HDR — correspondent à leurs empreintes sur disque. Aucun changement pendant l'exécution, fallback importé, exception JavaScript, erreur console, asset local échoué ou appel externe n'est relevé. Le HDR est chargé et appliqué avec la calibration −2 EV. Le contrôle de pixels passe sur les 26 images ; la couverture minimale dans sa zone de contrôle est de 87,51 %. Les diagnostics complets sont dans `.tools/modern/after/diagnostics.json`.

Trois planches assemblent les captures originales à leur résolution native, avec les mentions AVANT / APRÈS et les empreintes des PNG source :

- [Visage scientifique](.tools/modern/comparison-scientist.png), à caméra et éclairage de studio identiques.
- [Station en jeu](.tools/modern/comparison-station.png), à caméra desktop identique, avec son HDR calibré.
- [Drone](.tools/modern/comparison-drone.png), qui reste un modèle procédural.

Ces planches ne retouchent pas le rendu. Les dossiers `draft-*` sont des essais de critique, dont le HDR initial non calibré ; ils ne constituent pas des preuves de la version finale.

Les scènes finales à caméra fixe produisent les budgets suivants avant les passes plein écran. La fenêtre mobile est émulée dans Chromium et rend en interne à 331×717 ; les chiffres n'établissent pas un débit sur matériel réel.

| Scène | Profil et fenêtre | Appels de dessin | Triangles visibles |
| --- | --- | ---: | ---: |
| Acte IV | high, 1440×900 | 116 | 322 940 |
| Acte V | high, 1440×900 | 443 | 678 251 |
| Acte IV | mobile, 390×844 | 77 | 225 334 |
| Acte V | mobile, 390×844 | 305 | 209 075 |

La suite dédiée `tools/qa-assets.py` a validé les deux GLB sur le parcours natif et via la factory : trois clips effectivement lus, sommets réellement déformés, clones indépendants, première image Idle, pause, comportement explicite en l'absence d'attaque, ancre faciale à l'échelle normale, conservation des textures partagées et destruction répétée sans effet indésirable. Un essai séparé bloque volontairement les GLB et exige une erreur et un fallback déclarés. Les cinq rôles armés contrôlés gardent leur équipement lié à la main et libèrent ses matériaux. Les résultats sont consignés dans `.tools/assets/diagnostics.json` ; les modèles et le rendu ne sont pas remplacés dans le parcours positif.

La suite dédiée `tools/qa-environment.py` a validé cinq scénarios après la calibration −2 EV : HDR local et PMREM, comparaison à caméra fixe, partage entre pipelines et redimensionnement, destruction avec restauration de l'environnement précédent, puis chargement défaillant avec avertissement et fallback explicites. Les diagnostics sont dans `.tools/environment-calibrated/diagnostics.json` ; ces résultats sont séparés des captures de la scène du jeu.

Rocketbox reste une bibliothèque d'avatars plus ancienne, avec notamment quelques raccords de cheveux visibles dans les gros plans du médecin. Les détails ne sont pas ceux d'un scan récent ou d'une production AAA. Les essais Chromium/SwiftShader décrivent un rendu logiciel ; ils ne mesurent pas les performances d'une carte graphique ou d'un téléphone physique et ne représentent pas des tests réalisés par cinq personnes.
