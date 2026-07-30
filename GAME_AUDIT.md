# Audit de complétude — HIVE ASCENSION

Mise à jour : 30 juillet 2026

## Verdict

La campagne navigateur forme désormais une boucle complète : menu, prologue, cinq actes jouables, évolution biologique, création de Ruche, confrontation finale, choix de fin, sauvegarde et Codex. Les assets, personnages, lieux et dialogues sont originaux.

## Politique de cohérence

Le jeu reprend des règles générales d’horreur biologique sans extraire d’asset ni reproduire un personnage ou un dialogue licencié.

- Socle filmique : cycle œuf → parasite → hôte → juvénile → adulte, sang acide, Reine et ovipositeur.
- Univers étendu compatible : spécialisations de castes uniquement lorsqu’elles ne contredisent pas ce cycle.
- Adaptation originale : station MNEMOSYNE, LV-X91, Consortium IRISE, personnages, boss, missions et conclusions.
- Hors campagne principale : crossovers, hybrides uniques, personnages historiques et variantes incompatibles.

Références de vérification : [20th Century Studios — Aliens](https://www.20thcenturystudios.com/movies/aliens), [Free League — ALIEN RPG](https://freeleaguepublishing.com/games/alien/), [Focus — Aliens: Dark Descent](https://www.focus-entmt.com/en/games/aliens-dark-descent), [Andrew E. C. Gaska — Defining Canon](https://roguereviewer.wordpress.com/2020/10/12/defining-canon-in-an-alien-world/).

## Matrice de contenu

| Domaine | État livré |
|---|---|
| Intro et prologue | Menu diégétique, difficulté, reprise, briefing et transition vers l’Ovomorphe |
| Histoire | Cinq actes, missions suivies, journaux, enjeux de quarantaine et trois fins |
| Cycle biologique | Étapes explicites, sélection d’hôte, émergence, mue, nursery royale et ovipositeur |
| Castes | Ovomorphe, Facehugger, Chestburster, Drone, Runner, Warrior, Worker, Spitter, Praetorian, Reine |
| Actions | Capacités contextuelles par forme, chasse, cocon, embuscade et ordres synaptiques |
| Ennemis | Personnel, gardes, marines, incinérateur, smartgunner, commando, synthétiques et exosquelettes |
| Boss | Rencontres scénarisées, points faibles et phases de combat |
| Décors et props | Cloisons, conduites, passerelles, consoles, caisses, barils, générateurs, lumières et résine |
| Modèles 3D | Géométrie procédurale articulée, silhouettes distinctes, détails de carapace et équipement |
| Textures | Résine, carapace, panneaux industriels et bump organique, toutes originales et reproductibles |
| SFX | Synthèse Web Audio pour signaux, impacts, alarmes, ambiance et transformation |
| VFX | Particules, anneaux, impacts acides, flash de mue, éclairage et post-traitement |
| UI/UX | Objectifs, barres d’état, journal, bannière narrative, Codex, pause, réglages et fins |
| Accessibilité | Focus visible, clavier, tactile, contraste élevé, volume, luminosité et mouvements réduits |
| Persistance | Sauvegarde locale de l’acte, difficulté, Codex, journaux, réglages et conclusions |

## Règles de gameplay validées

- Un adulte n’est jamais créé directement par une dépense abstraite de biomasse.
- Un synthétique n’est pas un hôte viable.
- Le Drone n’utilise pas de projectile acide ; cette fonction appartient au Spitter.
- Les ordres sont phéromonaux ou synaptiques, jamais surnaturels.
- La Reine interrompt la ponte lorsqu’elle quitte son ovipositeur.
- La caste dépend de l’hôte ou d’une spécialisation/mue explicitement décrite.
- Les choix de fin dépendent de l’état de la Ruche et des objectifs accomplis.

## Provenance des assets

Les textures PNG de `assets/textures/` sont produites par `tools/generate-textures.mjs` à partir d’algorithmes déterministes. Les modèles sont assemblés au runtime dans `src/models.js`. Aucun fichier de film, jeu, comic ou autre œuvre n’est inclus.

Une génération de texture avec OpenAI ImageGen a été tentée pendant la production ; le service distant étant indisponible, la version livrée utilise la solution procédurale originale, reproductible et sans dépendance externe.

## Vérifications de sortie

- Syntaxe JavaScript vérifiée sur tous les scripts chargés.
- Parcours critique vérifié dans le navigateur, du menu aux conclusions.
- Absence d’erreurs console bloquantes.
- Contrôle visuel desktop et responsive.
- Déploiement de production revérifié après publication.

Le dossier `audit/current-flow/` conserve localement les captures de contrôle et n’est pas publié avec le jeu.
