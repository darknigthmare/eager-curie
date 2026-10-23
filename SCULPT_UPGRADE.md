# Sculpture et inspection des modèles — 20 octobre 2026

Cette passe répond au retour sur les formes encore trop simples de la version `736f595`. Les captures rapprochées montrent les défauts que les petites galeries masquaient : thorax en coque lisse, côtes indépendantes, extrémités de tubes, yeux rapportés, cou mal joint et relief de peau régulier. Les modèles restent des créations procédurales stylisées ; aucune correspondance photoréaliste ou « 1:1 » avec une œuvre de référence n'est revendiquée.

## Formes et surfaces

- Les créatures utilisent des surfaces anatomiques continues, avec des sections variables pour le thorax, les membres, les paumes et les doigts. Les crânes, queues, pétales et formes larvaires possèdent des extrémités fermées et des normales raccordées. Les doigts adoptent une pose de repos descendante.
- Le dôme du Drone, les reliefs du Warrior, la posture quadrupède du Runner et le bouclier crânien de la Reine restent différenciés. Les petites surfaces terminales du crâne ont été arrondies après inspection en gros plan.
- Les visages comportent des volumes de front, orbites, joues, nez, mâchoire et oreilles. Les yeux se placent dans les paupières, avec iris, pupille et cornée. Les plis de vêtements, colliers, sangles, mains et chaussures suivent davantage l'anatomie et les articulations.
- Les matériaux associent les cartes PBR à une variation spatiale de surface. Les bandes régulières et le relief trop fort ont été réduits après capture ; les pores de peau ont été atténués quatre fois. La résine opaque non émissive reçoit une finition charbon plus rugueuse, en conservant les traitements spécifiques de l'acide et des cocons.
- Les cartes locales détaillées montent à 2048×2048 pour les matériaux concernés : huit cartes à cette définition et quatorze à 1024×1024, toutes chargées lors du contrôle. Le jeu conserve 22 cartes, représentant 8 850 735 octets au total. Leur validation vérifie les CRC, les raccords, les cartes scalaires, les normales et la régénération déterministe.

## Méthode de comparaison

La référence `736f595` est servie depuis une archive isolée ; les captures finales utilisent les fichiers du dépôt courant. Les portraits sont présentés un par un en 1440×900, sous un éclairage de studio neutre, avec les mêmes angles de trois quarts et de profil. Le cadrage du corps s'adapte à la taille du sujet pour permettre d'inspecter les formes. Pour les trois gros plans de visage, la position de caméra, la cible et le champ de vision reprennent exactement les valeurs enregistrées sur la référence. Cette égalité est vérifiée : la nouvelle gorge, désormais intégrée au modèle de tête, ne peut donc pas faire reculer artificiellement la caméra.

Un rendu de silhouette séparé mesure la hauteur réellement occupée par le modèle et impose au moins 60 % de l'image. Les 14 portraits de référence occupent entre 75,3 et 94 % de la hauteur ; les 14 portraits finaux, entre 79,3 et 94 %. Les créatures ont deux vues ; les humains possèdent une vue de corps et un gros plan du visage.

Deux captures supplémentaires fixent la même caméra d'inspection à 50 % sur l'ancienne et la nouvelle version, en 1440×900 et 390×844. Elles permettent de distinguer l'amélioration du modèle d'un simple changement de distance de caméra.

Les preuves sont générées sous `.tools/sculpt/before/` et `.tools/sculpt/after/`, avec un fichier `diagnostics.json` pour chaque exécution. Les captures intermédiaires `draft*` servent à la critique ; elles ne constituent pas une validation de publication. Le contrôle d'empreintes a effectivement rejeté des captures réalisées pendant que les modules changeaient.

## Inspection dans le jeu

Le réglage de distance de caméra va de 50 à 135 %. La molette l'ajuste par pas de 5 % pendant les actes I à IV. La pause, les séquences de caméra cinématique et la vue générale RTS conservent leur cadrage. La distance est sauvegardée avec les autres réglages.

La validation graphique conserve une boucle de rendu dédiée pendant les captures : la simulation et la caméra restent fixes, et le framebuffer WebGL reste disponible pour la composition. Le contrôle de pixels rejette une image où seul le HUD apparaît sur un monde noir. Les empreintes des scripts servis sont comparées aux fichiers finaux du dépôt ; les textures sont attendues avant la capture.

## Résultats du contrôle final

Le navigateur Chromium avec SwiftShader a validé cinq groupes de contrôles :

1. Initialisation native des cinq actes avec les modèles et les matériaux finaux ; cela vérifie leur chargement, pas une campagne jouée intégralement.
2. Deux cycles de profils mobile, high et ultra avec redimensionnement, dimensions CSS correctes et ressources stables : 255 géométries et 48 textures sur la scène de contrôle.
3. Libération du post-traitement : une géométrie et quatre textures libérées, puis second appel sans effet ni erreur.
4. Réglages graphiques réels dans le DOM, restauration du profil ultra, récupération d'une ancienne valeur invalide et adaptation automatique entre 390×844 et 1440×900.
5. Réglage de distance réel au clavier, molette par pas de 5 %, bornes 50/135, maintien pendant la pause, la séquence thoracique et le RTS ; restauration de 55 % après rechargement, et normalisation des valeurs invalides vers 100/135/50 %.

Les diagnostics finaux contiennent 26 captures, trois galeries et 14 portraits. Les neuf scripts instrumentés correspondent aux fichiers du dépôt ; aucune modification du runtime n'a été détectée pendant les captures. Aucune exception JavaScript, erreur console, ressource locale échouée ou requête externe n'a été relevée. Le contrôle de monde visible passe sur les 26 captures, avec au moins 67,96 % de pixels non noirs dans la zone de contrôle. Cette mesure détecte les captures vides ; l'appréciation des formes et des matières repose aussi sur leur inspection visuelle.

La reprise finale des seuls gros plans de visage fusionne les diagnostics après vérification des neuf empreintes identiques. Elle conserve les résultats fonctionnels du passage complet et remplace les trois portraits par leurs cadrages de référence exacts.

Les planches [Drone](.tools/sculpt/comparison-drone.png) et [scientifique](.tools/sculpt/comparison-scientist.png) assemblent les PNG originaux à leur résolution native, avec les mentions AVANT / APRÈS. Elles ne retouchent pas le rendu ; les empreintes des deux fichiers source sont enregistrées dans les diagnostics.

## Coût géométrique et limites

Le détail supplémentaire augmente nettement le nombre de triangles. Les chiffres suivants sont ceux du rendu de scène avant les passes plein écran, à caméra fixe ; ils ne sont pas une mesure de débit matériel.

| Scène | Profil et fenêtre | Appels de dessin | Triangles visibles |
| --- | --- | ---: | ---: |
| Acte IV | high, 1440×900 | 95 | 196 286 |
| Acte V | high, 1440×900 | 636 | 1 623 964 |
| Acte IV | mobile, 390×844 | 59 | 168 616 |
| Acte V | mobile, 390×844 | 371 | 591 850 |

Dans la galerie finale, le Drone compte 157 220 triangles pour 27 appels, le Warrior 164 212 pour 27, le Runner 102 342 pour 25 et la Reine 199 668 pour 36. Les trois humanoïdes montrés comptent de 153 524 à 176 828 triangles pour 34 à 38 appels, contre environ 29 000 à 34 000 triangles sur la référence. Le profil mobile réduit la résolution de rendu et certains effets, sans constituer une réduction automatique de la géométrie des personnages.

Les échantillons temporels sont très variables sous SwiftShader ; aucune amélioration de FPS ni fluidité sur matériel réel n'est déduite de ces données. Ces essais automatisés et leur inspection ne remplacent pas cinq testeurs humains, une campagne jouée de bout en bout ou une mesure sur téléphone physique. La direction visuelle demeure stylisée et procédurale.

## Reproduire

Les outils facultatifs de vérification nécessitent Python, Playwright, Pillow et Chromium. Ils ne sont pas nécessaires pour jouer.

```bash
python3 tools/serve.py --port 8082
# Dans un second terminal, depuis la racine du dépôt :
python3 tools/qa-graphics.py --url http://127.0.0.1:8082/ --label after --output .tools/sculpt --portraits --matched-inspection
```

Pour une critique ciblée, le même outil accepte `--portraits-only --portrait-subjects drone,queen,scientist`. Il produit alors des vues de ces sujets sans exécuter les autres contrôles graphiques. `--portrait-frames face --merge-diagnostics` permet de reprendre uniquement les visages tout en conservant les contrôles d'une version du runtime strictement identique. Les cadrages de visage réutilisent automatiquement `.tools/sculpt/before/diagnostics.json` lorsqu'il existe.
