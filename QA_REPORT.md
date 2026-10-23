# Vérification HIVE ASCENSION — 20 octobre 2026

Cette revue a été répartie entre cinq agents QA : gameplay et niveau, graphismes, interface, sauvegarde et réglages, puis régression intégrée. Il ne s'agit pas de cinq testeurs humains.

La régression a été réexécutée après l’intégration des humains GLB animés, du HDR et des nouveaux détails de station : **24 scénarios intégrés, 20 contrôles de gameplay et trois groupes de sauvegarde réussis**. Les contrôles dédiés aux imports et les cinq scénarios HDR passent également. Les 26 captures finales, dont 14 portraits, et les budgets sont détaillés dans [MODERN_ASSETS.md](MODERN_ASSETS.md). [SCULPT_UPGRADE.md](SCULPT_UPGRADE.md) et [GRAPHICS_UPGRADE.md](GRAPHICS_UPGRADE.md) conservent les passes précédentes.

## Résultats

La validation intégrée utilise Chromium avec WebGL logiciel SwiftShader, le serveur `tools/serve.py` et les en-têtes de sécurité de `vercel.json`. Three.js, ses loaders, les polices, les textures, les deux GLB et le HDR sont servis localement. Cette suite ne remplace ni les requêtes réseau ni les scripts de l'application.

| Axe | Vérification effectuée |
| --- | --- |
| Gameplay et niveau | 20 assertions ciblées : navigation autour des obstacles, limites de station, visibilité des attaques, parcours des unités RTS, interruption de purge, transparence des murs devant la caméra et transitions 2→3, 3→4, 4→5 avec conditions préparées. |
| Graphismes | Deux GLB réellement chargés : skinning de 80 os, trois clips distincts, sommets déformés, clones indépendants, pause, ancres faciales et armes liées à la main ; échec explicite avec secours dans un contexte négatif séparé. Cinq scénarios HDR et cinq groupes graphiques réussis, sans fallback dans les captures finales. En complément, 31 cas Node des fabriques procédurales de secours : deux œufs, un Facehugger, deux juvéniles, sept adultes, onze humains et huit accessoires. Coordonnées finies, géométries non vides et retour du nombre de matériaux à sa valeur initiale après destruction. 18 cas complémentaires sur les articulations, vêtements et ressources partagées ; 17 gabarits organiques contrôlés pour leur fermeture, leur orientation, leurs normales, les UV physiques et l’indépendance des clones. Contrôle visuel dans Chromium. |
| Interface | Captures bureau et émulation tactile 390×844, absence de débordement horizontal, HUD mobile repliable, focus clavier et réglages accessibles. |
| Sauvegarde et réglages | Trois groupes de tests dédiés : données invalides, stockage indisponible, sauvegarde en mémoire, fermeture des dialogues, restauration du son et des réglages. |
| Régression intégrée | **24 scénarios réussis, 0 échec**, sans erreur JavaScript non interceptée ni ressource locale en échec. Résultats détaillés et durées dans `.tools/qa-modern-final/results.json`. |

La suite intégrée couvre :

- HTTP, scripts locaux, WebGL r128, six variantes de polices et 22 textures PNG ; les imports GLB et le HDR sont aussi validés par leurs suites dédiées ;
- nouvelle campagne par les boutons, trois calibrations, stimulus, arrivée de l'hôte, ouverture, éclosion et sauvegarde de l'acte II ;
- visions F1/F2/F3, pause, codex, navigation des onglets et réglages accessibles ;
- initialisation et simulation des cinq actes, Reine et trois relais, refus d'un cycle sans biomasse ;
- rechargement et reprise d'une sauvegarde conservant acte, difficulté, caste et hôte ; retour au menu puis nouvelle campagne ;
- les trois choix de fin, leurs épilogues et la conservation cumulée des découvertes ;
- sauvegarde JSON corrompue et refus des accès à `localStorage` ;
- émulation tactile 390×844, contrôle du HUD et absence de débordement ;
- politique CSP, protection MIME, exclusion des métadonnées Git, des outils et des listes de dossiers ; absence d'erreur JavaScript non interceptée et de requête locale en échec.

## Portée et limites

Les actes II à V sont initialisés par l'API publique pour les contrôles de démarrage. Les transitions ciblées utilisent les règles réelles avec des positions, adversaires ou ressources préparés ; ce n'est pas une campagne complète jouée à la main. Les trois fins utilisent les vrais boutons et épilogues après préparation des conditions de conquête.

La navigation de l'hôte de l'acte I est vérifiée à pas fixe de 60 Hz dans la suite intégrée pour isoler le comportement de l'IA de la vitesse du rendu logiciel. Les durées de la suite ne constituent pas une mesure des performances sur une carte graphique réelle.

Les captures de campagne sont conservées sous `.tools/qa-modern-final/` et les comparaisons graphiques sous `.tools/modern/`. Les dix scripts et quatre ressources importées servis pendant les captures finales correspondent aux empreintes du dépôt ; aucune requête externe, erreur console ou ressource locale en échec n’y a été relevée. Les créatures restent procédurales ; le remplacement Meshy et la fidélité « 1:1 » restent à réaliser, comme indiqué dans le rapport graphique. Les tests ne couvrent pas Safari, Firefox, un téléphone physique ou une évaluation humaine de la qualité sonore. La publication Vercel est déclenchée par les pushs sur `main`, selon la configuration confirmée du projet. Son état en ligne n’est pas vérifiable depuis cet environnement : le proxy réseau refuse le tunnel vers `eager-curie.vercel.app` avec HTTP 403. Les résultats ci-dessus concernent le serveur local avec les en-têtes de production.

## Reproduire

Les outils nécessitent Python, Playwright pour Python et Chromium. Aucun changement de logique n'est nécessaire pour la suite intégrée.

```bash
python3 tools/serve.py --port 8082
# Dans un second terminal, depuis la racine du dépôt :
python3 tools/qa-browser.py --url http://127.0.0.1:8082/ --output .tools/qa-modern-final
python3 tools/qa-gameplay.py --url http://127.0.0.1:8082
python3 tools/qa-persistence.py --url http://127.0.0.1:8082/
node tools/qa-models.cjs
node tools/qa-model-detail.cjs
node tools/qa-organic.cjs
python3 tools/vendor-models.py --verify
python3 tools/qa-assets.py --url http://127.0.0.1:8082/
python3 tools/qa-environment.py --url http://127.0.0.1:8082/
python3 tools/qa-graphics.py --url http://127.0.0.1:8082/ --portraits --matched-inspection --require-assets --require-hdr
```

La suite de gameplay ajoute uniquement un accès de test aux objets internes dans la réponse du script pour inspecter navigation et collisions. La suite intégrée utilise les fichiers servis sans instrumentation.
