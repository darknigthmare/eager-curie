/* global window */

(() => {
  "use strict";

  // ===========================================================================
  // [MÉTADONNÉES] Identité du catalogue et politique de cohérence
  // ===========================================================================

  const HIVE_CONTENT = {
    metadata: {
      schema: "hive-content-v1",
      version: "1.0.0",
      language: "fr-FR",
      updatedAt: "2026-07-30",
      projectTitle: "HIVE ASCENSION",
      campaignTitle: "Les Archives de MNEMOSYNE",
      location: {
        name: "Station MNEMOSYNE",
        designation: "LV-X91",
        region: "Ceinture extérieure du système Nysa",
        function: "Raffinerie orbitale et laboratoire de xénobiologie clandestin"
      },
      synopsis:
        "Sur LV-X91, la station MNEMOSYNE a réveillé un organisme saisi dans une épave. " +
        "Le joueur guide son cycle biologique, survit au confinement puis transforme la station en ruche.",
      contentRatingNotes: [
        "Horreur biologique stylisée",
        "Violence de science-fiction non réaliste",
        "Aucun texte, son, modèle ou visuel extrait d'une œuvre existante"
      ],
      assetPolicy: {
        textures: "Textures procédurales, photographiées ou génératives entièrement originales.",
        models: "Silhouettes et détails 3D originaux, sans reproduction exacte d'un modèle protégé.",
        audio: "Synthèse, enregistrements originaux ou bibliothèques disposant d'une licence compatible.",
        writing: "Personnages, station, journaux, dialogues et événements créés pour cette campagne.",
        forbidden: [
          "Extraction d'assets depuis un film, un jeu ou une bande dessinée",
          "Reproduction d'un logo de société fictive existante",
          "Citation de dialogue reconnaissable",
          "Utilisation d'un personnage historique de la franchise"
        ]
      },
      canonPolicy: {
        purpose:
          "Préserver les règles biologiques reconnaissables tout en gardant une histoire et des assets originaux.",
        levels: {
          filmCore: {
            id: "FILM_CORE",
            label: "Socle filmique",
            rule: "Cycle biologique, comportement prédateur, sang acide et fonction reproductrice de la Reine."
          },
          expandedCompatible: {
            id: "EXPANDED_COMPATIBLE",
            label: "Univers étendu compatible",
            rule:
              "Spécialisations de ruche utiles au gameplay, admises seulement lorsqu'elles ne contredisent pas le socle."
          },
          inspiredOriginal: {
            id: "INSPIRED_ORIGINAL",
            label: "Adaptation originale",
            rule:
              "Mécanique créée pour le jeu et signalée comme telle dans le codex ou les notes de laboratoire."
          },
          excludedFromCore: {
            id: "EXCLUDED_FROM_CORE",
            label: "Hors campagne principale",
            rule:
              "Hybrides uniques, crossovers et variantes incompatibles ne font pas partie de l'arbre principal."
          }
        },
        invariants: [
          "Une unité adulte ne naît jamais directement d'une dépense abstraite de biomasse.",
          "La production passe par un œuf, un parasite, un hôte organique et un juvénile.",
          "Un synthétique n'est pas un hôte viable.",
          "Le sang acide est dangereux pour les ennemis, la ruche et l'intégrité de la station.",
          "Le Drone standard ne possède pas de projectile acide ; cette fonction appartient au Spitter.",
          "La Reine doit interrompre la ponte lorsqu'elle quitte son ovipositeur pour combattre.",
          "Les ordres de ruche sont décrits comme phéromonaux ou synaptiques, jamais comme une possession magique.",
          "Les formes pathogènes et hybrides ne sont pas des castes naturelles de cette campagne."
        ]
      }
    },

    // =========================================================================
    // [NARRATION] Prologue, cinq actes et progression dramatique
    // =========================================================================

    narrative: {
      prologue: {
        id: "PROLOGUE",
        title: "La cargaison muette",
        summary:
          "Le remorqueur civil ÉCHO-12 livre à MNEMOSYNE un conteneur récupéré près d'une épave sans balise. " +
          "Le Consortium IRISE falsifie le manifeste et place l'objet en incubation.",
        openingBeats: [
          "Vue extérieure de LV-X91 et de la raffinerie MNEMOSYNE en rotation lente.",
          "Transmission incomplète du remorqueur ÉCHO-12, coupée avant l'identification de la cargaison.",
          "Inspection robotisée d'un œuf fermé dans une chambre froide.",
          "Ordre de réveil envoyé par la directrice de quarantaine malgré les réserves de l'équipe.",
          "Passage au point de vue sensoriel de l'Ovomorphe."
        ],
        missionIds: ["P_M01"]
      },
      acts: [
        {
          id: "ACT_1",
          index: 1,
          title: "Germination",
          playableForms: ["ovomorphe", "facehugger"],
          dramaticQuestion: "L'organisme peut-il attirer un hôte avant que le laboratoire ne le stérilise ?",
          summary:
            "Le joueur réveille l'Ovomorphe, trompe les capteurs thermiques et libère le Facehugger au moment opportun.",
          missionIds: ["A1_M01", "A1_M02"]
        },
        {
          id: "ACT_2",
          index: 2,
          title: "Empreinte",
          playableForms: ["facehugger"],
          dramaticQuestion: "Quel hôte donnera à la future créature les meilleures chances de survie ?",
          summary:
            "Le parasite traverse les laboratoires pendant le verrouillage et choisit entre un humain agile, " +
            "un humain protégé ou un animal de service quadrupède.",
          missionIds: ["A2_M01", "A2_M02"]
        },
        {
          id: "ACT_3",
          index: 3,
          title: "Naissance",
          playableForms: ["chestburster"],
          dramaticQuestion: "Le juvénile atteindra-il un refuge avant la purge thermique ?",
          summary:
            "Après l'émergence, le Chestburster fuit une équipe de confinement, accumule de la matière " +
            "et mue dans un échangeur abandonné.",
          missionIds: ["A3_M01", "A3_M02"]
        },
        {
          id: "ACT_4",
          index: 4,
          title: "Prédation",
          playableForms: ["drone", "runner", "warrior", "spitter"],
          dramaticQuestion: "La créature peut-elle créer une nursery sans exterminer tous ses futurs hôtes ?",
          summary:
            "L'adulte sabote le réseau de surveillance, apprend à capturer plutôt qu'à tuer et prépare " +
            "une chambre d'incubation dans les niveaux de raffinage.",
          missionIds: ["A4_M01", "A4_M02", "A4_M03"]
        },
        {
          id: "ACT_5",
          index: 5,
          title: "Ascension",
          playableForms: ["worker", "warrior", "spitter", "praetorian", "queen"],
          dramaticQuestion: "La ruche contrôlera-t-elle MNEMOSYNE avant l'autodestruction ou l'évacuation humaine ?",
          summary:
            "Le réseau synaptique se développe, une lignée royale naît et la contre-offensive du Consortium " +
            "force la Reine à choisir entre territoire, propagation et destruction.",
          missionIds: ["A5_M01", "A5_M02", "A5_M03"]
        }
      ],
      recurringThemes: [
        "Le coût de la curiosité scientifique sans limite",
        "La mémoire institutionnelle effacée pour protéger un profit",
        "Le conflit entre tuer une menace et préserver un hôte",
        "L'opposition entre contrôle technologique et adaptation biologique",
        "La transformation progressive d'un lieu industriel en organisme collectif"
      ]
    },

    // =========================================================================
    // [MISSIONS] Objectifs jouables et déclencheurs d'intégration
    // =========================================================================

    missions: {
      P_M01: {
        id: "P_M01",
        actId: "PROLOGUE",
        title: "Objet sans manifeste",
        description: "Découvrir la livraison clandestine et les raisons du réveil biologique.",
        playableCaste: null,
        objectives: [
          {
            id: "watch_arrival",
            eventId: "prologue.arrival.complete",
            type: "primary",
            label: "Observer l'amarrage d'ÉCHO-12",
            required: true
          },
          {
            id: "hear_order",
            eventId: "prologue.awakening_order.complete",
            type: "primary",
            label: "Recevoir l'ordre d'incubation",
            required: true
          }
        ],
        failureConditions: [],
        rewards: {
          codexEntries: ["codex_mnemosyne", "codex_irise"],
          journalIds: ["journal_01"]
        }
      },
      A1_M01: {
        id: "A1_M01",
        actId: "ACT_1",
        title: "Sous la coquille",
        description: "Lire les stimuli autour de l'Ovomorphe sans déclencher la stérilisation.",
        playableCaste: "ovomorphe",
        objectives: [
          {
            id: "scan_room",
            eventId: "egg.senses.calibrated",
            type: "primary",
            label: "Identifier trois sources de chaleur",
            target: 3,
            required: true
          },
          {
            id: "mislead_sensor",
            eventId: "egg.sensor.misled",
            type: "primary",
            label: "Détourner le capteur de quarantaine",
            required: true
          },
          {
            id: "keep_shell_closed",
            eventId: "egg.premature_opening.avoided",
            type: "secondary",
            label: "Ne pas s'ouvrir pendant le premier scan",
            required: false
          }
        ],
        failureConditions: ["Stérilisation thermique de l'Ovomorphe"],
        rewards: {
          codexEntries: ["codex_ovomorphe", "codex_sens_biologique"],
          journalIds: ["journal_02"]
        }
      },
      A1_M02: {
        id: "A1_M02",
        actId: "ACT_1",
        title: "Fenêtre d'éclosion",
        description: "Attirer un organisme viable puis ouvrir les pétales hors du cône des caméras.",
        playableCaste: "ovomorphe",
        objectives: [
          {
            id: "create_stimulus",
            eventId: "egg.stimulus.emitted",
            type: "primary",
            label: "Émettre un signal biologique de proximité",
            required: true
          },
          {
            id: "wait_camera",
            eventId: "egg.camera.blind_window",
            type: "primary",
            label: "Attendre l'angle mort de la caméra",
            required: true
          },
          {
            id: "release_facehugger",
            eventId: "egg.facehugger.released",
            type: "primary",
            label: "Libérer le Facehugger",
            required: true
          }
        ],
        failureConditions: ["Ouverture sans hôte à portée", "Destruction du parasite avant sa sortie"],
        rewards: {
          unlockCastes: ["facehugger"],
          codexEntries: ["codex_facehugger"]
        }
      },
      A2_M01: {
        id: "A2_M01",
        actId: "ACT_2",
        title: "Le sol et les conduits",
        description: "Quitter l'incubateur et atteindre le secteur médical sans être capturé.",
        playableCaste: "facehugger",
        objectives: [
          {
            id: "leave_incubator",
            eventId: "facehugger.incubator.exited",
            type: "primary",
            label: "Franchir le sas d'incubation",
            required: true
          },
          {
            id: "cross_vents",
            eventId: "facehugger.vent_route.complete",
            type: "primary",
            label: "Traverser deux conduits techniques",
            target: 2,
            required: true
          },
          {
            id: "avoid_light",
            eventId: "facehugger.searchlight.avoided",
            type: "secondary",
            label: "Ne jamais rester dans un faisceau plus de deux secondes",
            required: false
          }
        ],
        failureConditions: ["Parasite immobilisé par une perche de contention", "Exposition prolongée au feu"],
        rewards: {
          codexEntries: ["codex_confinement"],
          journalIds: ["journal_03"]
        }
      },
      A2_M02: {
        id: "A2_M02",
        actId: "ACT_2",
        title: "Choix de l'hôte",
        description: "Évaluer les organismes disponibles, vaincre leur défense puis implanter l'embryon.",
        playableCaste: "facehugger",
        objectives: [
          {
            id: "evaluate_hosts",
            eventId: "facehugger.hosts.scanned",
            type: "primary",
            label: "Évaluer trois hôtes potentiels",
            target: 3,
            required: true
          },
          {
            id: "grapple_host",
            eventId: "facehugger.grapple.success",
            type: "primary",
            label: "Réussir l'agrippement",
            required: true
          },
          {
            id: "complete_implantation",
            eventId: "facehugger.implantation.complete",
            type: "primary",
            label: "Maintenir l'hôte jusqu'à la fin de l'implantation",
            required: true
          }
        ],
        branchOutcomes: {
          agileHuman: "drone",
          armoredHuman: "warrior",
          quadrupedAnimal: "runner"
        },
        failureConditions: ["Parasite arraché avant la fin de l'implantation", "Hôte tué pendant la lutte"],
        rewards: {
          unlockCastes: ["chestburster"],
          codexEntries: ["codex_empreinte_hote"],
          journalIds: ["journal_04"]
        }
      },
      A3_M01: {
        id: "A3_M01",
        actId: "ACT_3",
        title: "Premier souffle",
        description: "Choisir une sortie sûre, émerger et disparaître avant l'arrivée du confinement.",
        playableCaste: "chestburster",
        objectives: [
          {
            id: "choose_exit",
            eventId: "chestburster.exit.selected",
            type: "primary",
            label: "Repérer le chemin présentant le moins de résistance",
            required: true
          },
          {
            id: "erupt",
            eventId: "chestburster.eruption.complete",
            type: "primary",
            label: "Émerger de l'hôte",
            required: true
          },
          {
            id: "reach_cover",
            eventId: "chestburster.cover.reached",
            type: "primary",
            label: "Atteindre un abri en moins de vingt secondes",
            timeLimitSeconds: 20,
            required: true
          }
        ],
        failureConditions: ["Juvénile neutralisé avant d'atteindre un abri"],
        rewards: {
          codexEntries: ["codex_chestburster", "codex_sang_acide"]
        }
      },
      A3_M02: {
        id: "A3_M02",
        actId: "ACT_3",
        title: "Mue froide",
        description: "Accumuler assez de matière et préparer une chrysalide dans un échangeur condamné.",
        playableCaste: "chestburster",
        objectives: [
          {
            id: "collect_biomass",
            eventId: "chestburster.biomass.collected",
            type: "primary",
            label: "Récupérer quatre unités de matière organique",
            target: 4,
            required: true
          },
          {
            id: "find_heat_exchanger",
            eventId: "chestburster.molt_site.reached",
            type: "primary",
            label: "Trouver l'échangeur hors service",
            required: true
          },
          {
            id: "complete_molt",
            eventId: "chestburster.molt.complete",
            type: "primary",
            label: "Achever la mue sans être découvert",
            required: true
          }
        ],
        failureConditions: ["Purge thermique du refuge", "Découverte de la chrysalide"],
        rewards: {
          unlockFromBranch: true,
          codexEntries: ["codex_mue", "codex_drone", "codex_runner", "codex_warrior"],
          journalIds: ["journal_05"]
        }
      },
      A4_M01: {
        id: "A4_M01",
        actId: "ACT_4",
        title: "Angle mort",
        description: "Tester les défenses de MNEMOSYNE et couper son réseau de détection.",
        playableCaste: "adult_branch",
        objectives: [
          {
            id: "study_patrol",
            eventId: "adult.patrol.pattern.learned",
            type: "primary",
            label: "Observer deux cycles de patrouille",
            target: 2,
            required: true
          },
          {
            id: "disable_relays",
            eventId: "adult.security_relay.disabled",
            type: "primary",
            label: "Neutraliser trois relais sans déclencher l'alarme maximale",
            target: 3,
            required: true
          },
          {
            id: "no_acid_breach",
            eventId: "adult.hull_breach.avoided",
            type: "secondary",
            label: "Éviter toute brèche causée par le sang acide",
            required: false
          }
        ],
        failureConditions: ["Capture vivante de l'adulte", "Décompression du secteur"],
        rewards: {
          codexEntries: ["codex_reseau_securite"],
          journalIds: ["journal_06"]
        }
      },
      A4_M02: {
        id: "A4_M02",
        actId: "ACT_4",
        title: "Chasser sans tuer",
        description: "Neutraliser les gardes tout en conservant assez d'organismes pour la nursery.",
        playableCaste: "adult_branch",
        objectives: [
          {
            id: "incapacitate_targets",
            eventId: "adult.target.incapacitated",
            type: "primary",
            label: "Neutraliser quatre menaces",
            target: 4,
            required: true
          },
          {
            id: "preserve_hosts",
            eventId: "adult.host.preserved",
            type: "primary",
            label: "Préserver au moins trois hôtes organiques",
            target: 3,
            required: true
          },
          {
            id: "perform_ceiling_ambush",
            eventId: "adult.ceiling_ambush.success",
            type: "secondary",
            label: "Réussir une embuscade depuis le plafond",
            required: false
          }
        ],
        failureConditions: ["Moins de deux hôtes encore viables"],
        rewards: {
          unlockCastes: ["spitter"],
          codexEntries: ["codex_nursery", "codex_spitter"]
        }
      },
      A4_M03: {
        id: "A4_M03",
        actId: "ACT_4",
        title: "La nursery",
        description: "Transformer les niveaux de raffinage en site d'incubation défendable.",
        playableCaste: "drone",
        objectives: [
          {
            id: "weave_first_resin",
            eventId: "hive.resin.first_patch",
            type: "primary",
            label: "Tisser les premiers ancrages de résine",
            required: true
          },
          {
            id: "cocoon_hosts",
            eventId: "hive.host.cocooned",
            type: "primary",
            label: "Coconner trois hôtes viables",
            target: 3,
            required: true
          },
          {
            id: "defend_nursery",
            eventId: "hive.nursery.wave_defeated",
            type: "primary",
            label: "Repousser l'équipe de récupération",
            required: true
          }
        ],
        failureConditions: ["Tous les hôtes de la nursery tués", "Cœur de résine détruit"],
        rewards: {
          unlockCastes: ["worker"],
          codexEntries: ["codex_worker", "codex_economie_ruche"],
          journalIds: ["journal_07"]
        }
      },
      A5_M01: {
        id: "A5_M01",
        actId: "ACT_5",
        title: "Lignée royale",
        description: "Achever un cycle royal au lieu de faire apparaître une Reine par une dépense de biomasse.",
        playableCaste: "praetorian",
        objectives: [
          {
            id: "secure_royal_host",
            eventId: "hive.royal_host.secured",
            type: "primary",
            label: "Sécuriser l'hôte royal",
            required: true
          },
          {
            id: "protect_royal_molt",
            eventId: "hive.royal_molt.defended",
            type: "primary",
            label: "Protéger la mue royale pendant la contre-attaque",
            required: true
          },
          {
            id: "awaken_queen",
            eventId: "hive.queen.awakened",
            type: "primary",
            label: "Éveiller la Reine",
            required: true
          }
        ],
        failureConditions: ["Hôte royal détruit", "Praetorian neutralisé avant l'éveil"],
        rewards: {
          unlockCastes: ["praetorian", "queen"],
          codexEntries: ["codex_praetorian", "codex_queen"],
          journalIds: ["journal_08"]
        }
      },
      A5_M02: {
        id: "A5_M02",
        actId: "ACT_5",
        title: "Mémoire contre instinct",
        description: "Étendre la ruche pendant que PALIMPSESTE transforme la station en piège.",
        playableCaste: "queen",
        objectives: [
          {
            id: "infest_sectors",
            eventId: "hive.sector.infested",
            type: "primary",
            label: "Infester quatre secteurs stratégiques",
            target: 4,
            required: true
          },
          {
            id: "disable_purge",
            eventId: "hive.purge.disabled",
            type: "primary",
            label: "Désactiver les vannes de purge",
            required: true
          },
          {
            id: "preserve_queen",
            eventId: "hive.queen.above_half_health",
            type: "secondary",
            label: "Maintenir l'intégrité de la Reine au-dessus de cinquante pour cent",
            required: false
          }
        ],
        failureConditions: ["Mort de la Reine", "Destruction de toutes les nurseries"],
        rewards: {
          codexEntries: ["codex_palimpseste"],
          bossUnlocks: ["BRIAREOS_7", "MANTIS_4"]
        }
      },
      A5_M03: {
        id: "A5_M03",
        actId: "ACT_5",
        title: "Ce que retiendra MNEMOSYNE",
        description: "Vaincre la dernière force de confinement puis choisir le destin de la ruche.",
        playableCaste: "queen",
        objectives: [
          {
            id: "defeat_exosuit",
            eventId: "boss.mantis.defeated",
            type: "primary",
            label: "Neutraliser MANTIS-4",
            required: true
          },
          {
            id: "break_ai_control",
            eventId: "boss.palimpseste.control_broken",
            type: "primary",
            label: "Briser le contrôle de PALIMPSESTE",
            required: true
          },
          {
            id: "choose_ending",
            eventId: "campaign.ending.selected",
            type: "primary",
            label: "Choisir le destin de la colonie",
            required: true
          }
        ],
        failureConditions: ["Mort de la Reine sans embryon royal de secours"],
        rewards: {
          endings: ["ENDING_DOMINION", "ENDING_EXODUS", "ENDING_ASHES"],
          codexEntries: ["codex_archives_complete"]
        }
      }
    },

    // =========================================================================
    // [CASTES] Rôles, actions, forces, faiblesses et statut lore
    // =========================================================================

    castes: {
      ovomorphe: {
        id: "ovomorphe",
        name: "Ovomorphe",
        priority: "P0",
        loreStatus: "FILM_CORE",
        role: "Incubateur sensible et piège biologique",
        evolutionFrom: ["queen_egg_laying"],
        evolvesTo: ["facehugger"],
        profile: { mobility: 0, stealth: 5, resilience: 2, control: 1, support: 1, range: 1 },
        actions: [
          {
            id: "sense_heat",
            name: "Lecture thermique",
            type: "sense",
            description: "Révèle brièvement les organismes et machines chaudes à travers les parois proches."
          },
          {
            id: "sense_vibration",
            name: "Lecture vibratoire",
            type: "sense",
            description: "Distingue pas, chariots et chocs pour anticiper une présence."
          },
          {
            id: "biological_pulse",
            name: "Impulsion biologique",
            type: "lure",
            loreStatus: "INSPIRED_ORIGINAL",
            description: "Produit un stimulus discret qui attire un sujet curieux vers l'incubateur."
          },
          {
            id: "open_petals",
            name: "Ouverture des pétales",
            type: "transform",
            description: "Libère le Facehugger ; l'action est irréversible et doit être minutée."
          }
        ],
        strengths: ["Dormance prolongée", "Détection sans ligne de vue", "Très difficile à remarquer avant l'ouverture"],
        weaknesses: ["Immobile", "Vulnérable au feu et à la stérilisation", "Une ouverture prématurée condamne le cycle"],
        counters: ["Scanner thermique", "Purge thermique", "Bras robotisé"]
      },
      facehugger: {
        id: "facehugger",
        name: "Facehugger",
        priority: "P0",
        loreStatus: "FILM_CORE",
        role: "Parasite mobile chargé de l'implantation",
        evolutionFrom: ["ovomorphe"],
        evolvesTo: ["chestburster"],
        profile: { mobility: 5, stealth: 4, resilience: 1, control: 3, support: 0, range: 1 },
        actions: [
          {
            id: "skitter",
            name: "Course rasante",
            type: "movement",
            description: "Accélère sous le mobilier et réduit la précision des attaques ennemies."
          },
          {
            id: "surface_cling",
            name: "Adhérence",
            type: "movement",
            description: "Permet de grimper aux murs, plafonds et conduits étroits."
          },
          {
            id: "face_grapple",
            name: "Bond facial",
            type: "attack",
            description: "Bondit vers le visage ; déclenche une lutte au lieu d'une implantation instantanée."
          },
          {
            id: "final_embrace",
            name: "Étreinte finale",
            type: "channel",
            description: "Maintient l'hôte avec les doigts et la queue jusqu'à implantation complète."
          }
        ],
        strengths: ["Extrêmement rapide", "Petite cible", "Ignore une grande partie de l'armure corporelle"],
        weaknesses: ["Très fragile", "Portée de bond courte", "Masques étanches et feu efficaces"],
        counters: ["Perche de contention", "Combinaison faciale étanche", "Incinérateur"]
      },
      chestburster: {
        id: "chestburster",
        name: "Chestburster",
        priority: "P0",
        loreStatus: "FILM_CORE",
        role: "Juvénile de fuite et de croissance",
        evolutionFrom: ["facehugger_implantation"],
        evolvesTo: ["drone", "runner", "warrior"],
        profile: { mobility: 4, stealth: 5, resilience: 1, control: 0, support: 0, range: 0 },
        actions: [
          {
            id: "choose_eruption_path",
            name: "Chemin d'émergence",
            type: "sense",
            description: "Compare plusieurs points de sortie et révèle leur niveau de danger."
          },
          {
            id: "erupt",
            name: "Émergence",
            type: "transform",
            description: "Quitte l'hôte et déclenche immédiatement une phase de fuite."
          },
          {
            id: "dart_to_cover",
            name: "Ruée vers l'ombre",
            type: "movement",
            description: "Fournit une accélération courte vers une cache détectée."
          },
          {
            id: "weave_molt_cocoon",
            name: "Chrysalide de mue",
            type: "transform",
            description: "Consomme la matière collectée et rend le juvénile immobile jusqu'à la forme adulte."
          }
        ],
        strengths: ["Très discret", "Accélération élevée", "Peut emprunter les plus petits conduits"],
        weaknesses: ["Ne doit pas combattre frontalement", "Aucune armure", "Mue immobile et détectable"],
        counters: ["Détecteur de mouvement proche", "Gaz de purge", "Unité de nettoyage thermique"]
      },
      drone: {
        id: "drone",
        name: "Drone",
        priority: "P0",
        loreStatus: "FILM_CORE",
        role: "Prédateur furtif et ravisseur d'hôtes",
        evolutionFrom: ["chestburster_human_agile"],
        evolvesTo: ["worker", "warrior", "praetorian"],
        profile: { mobility: 4, stealth: 5, resilience: 3, control: 3, support: 2, range: 0 },
        actions: [
          {
            id: "vent_stalk",
            name: "Traque en conduit",
            type: "movement",
            description: "Entre dans un réseau de ventilation et ressort depuis une grille choisie."
          },
          {
            id: "deadly_grab",
            name: "Saisie prédatrice",
            type: "control",
            description: "Immobilise puis permet de traîner un organisme vivant vers la nursery."
          },
          {
            id: "tail_spike",
            name: "Dard caudal",
            type: "attack",
            description: "Attaque perforante à courte portée, efficace contre une cible isolée."
          },
          {
            id: "inner_jaw",
            name: "Mâchoire interne",
            type: "finisher",
            description: "Exécution risquée ; tue la cible et la rend inutilisable comme hôte."
          },
          {
            id: "resin_cocoon",
            name: "Cocon de résine",
            type: "support",
            description: "Fixe un organisme neutralisé à une paroi de nursery."
          }
        ],
        strengths: ["Excellente furtivité", "Mobilité verticale", "Capture et transport d'hôtes"],
        weaknesses: ["Moins efficace sous feu soutenu", "Pas d'attaque à distance", "Perd de la valeur s'il tue tous les hôtes"],
        counters: ["Smartgun", "Flamme persistante", "Tourelle couvrant un conduit"]
      },
      runner: {
        id: "runner",
        name: "Runner",
        priority: "P1",
        loreStatus: "FILM_CORE",
        role: "Chasseur quadrupède de poursuite",
        evolutionFrom: ["chestburster_quadruped_host"],
        evolvesTo: ["praetorian"],
        profile: { mobility: 5, stealth: 3, resilience: 2, control: 2, support: 0, range: 0 },
        actions: [
          {
            id: "wall_sprint",
            name: "Sprint de surface",
            type: "movement",
            description: "Maintient sa vitesse sur murs et rampes pendant une courte durée."
          },
          {
            id: "pounce",
            name: "Pounce",
            type: "attack",
            description: "Renverse une cible après une course suffisamment longue."
          },
          {
            id: "scent_lock",
            name: "Verrou olfactif",
            type: "sense",
            description: "Marque la piste récente d'un organisme blessé ou paniqué."
          },
          {
            id: "low_profile_dodge",
            name: "Esquive rasante",
            type: "defense",
            description: "Change brutalement d'axe et passe sous un tir balayant."
          }
        ],
        strengths: ["Vitesse maximale", "Poursuite en terrain ouvert", "Silhouette basse"],
        weaknesses: ["Faible sous tir de suppression", "Capture d'hôte moins précise", "Peu utile à la construction"],
        counters: ["Mine de proximité", "Porte coupe-feu", "Tir gyrostabilisé"]
      },
      warrior: {
        id: "warrior",
        name: "Warrior",
        priority: "P0",
        loreStatus: "EXPANDED_COMPATIBLE",
        loreNote:
          "La silhouette d'assaut est cohérente avec le socle ; sa place exacte dans une chaîne de mue reste une adaptation.",
        role: "Soldat de ruche et briseur de ligne",
        evolutionFrom: ["chestburster_armored_human", "drone_specialization"],
        evolvesTo: ["praetorian"],
        profile: { mobility: 3, stealth: 2, resilience: 4, control: 2, support: 2, range: 0 },
        actions: [
          {
            id: "breach",
            name: "Brèche",
            type: "attack",
            description: "Endommage portes, barricades et blindages légers."
          },
          {
            id: "hive_guard",
            name: "Garde de la ruche",
            type: "stance",
            description: "Réduit les dégâts reçus près d'un œuf, d'un Worker ou de la Reine."
          },
          {
            id: "swarm_rush",
            name: "Ruée coordonnée",
            type: "command",
            description: "Synchronise une charge avec les Warriors proches."
          },
          {
            id: "armored_headbutt",
            name: "Heurt de carapace",
            type: "control",
            description: "Interrompt un artilleur ou repousse un ennemi hors de sa couverture."
          }
        ],
        strengths: ["Carapace renforcée", "Assaut en groupe", "Défense des objectifs"],
        weaknesses: ["Discret seulement avant le combat", "Lent dans les petits conduits", "Aucun projectile"],
        counters: ["Tir croisé", "Exosquelette", "Piège électrique"]
      },
      worker: {
        id: "worker",
        name: "Worker",
        priority: "P1",
        loreStatus: "EXPANDED_COMPATIBLE",
        role: "Constructeur, logisticien et soigneur de la ruche",
        evolutionFrom: ["drone_specialization"],
        evolvesTo: [],
        profile: { mobility: 2, stealth: 3, resilience: 2, control: 1, support: 5, range: 0 },
        actions: [
          {
            id: "weave_resin",
            name: "Tissage de résine",
            type: "build",
            description: "Crée une paroi, ralentit les intrus et étend la zone de ruche."
          },
          {
            id: "repair_hive",
            name: "Réparation organique",
            type: "support",
            description: "Restaure progressivement un cœur de résine ou un ovipositeur endommagé."
          },
          {
            id: "carry_egg",
            name: "Transport d'œuf",
            type: "logistics",
            description: "Déplace un œuf vers un hôte ou hors d'une zone menacée."
          },
          {
            id: "tend_cocoon",
            name: "Entretien de cocon",
            type: "support",
            description: "Stabilise un hôte et accélère la disponibilité de l'incubation."
          }
        ],
        strengths: ["Économie de ruche", "Fortification", "Maintenance des objectifs biologiques"],
        weaknesses: ["Très faible seul", "Lent", "Doit être escorté"],
        counters: ["Raid rapide", "Feu", "Destruction à distance des structures"]
      },
      spitter: {
        id: "spitter",
        name: "Spitter",
        priority: "P1",
        loreStatus: "EXPANDED_COMPATIBLE",
        role: "Appui corrosif et contrôle de zone",
        evolutionFrom: ["drone_specialization"],
        evolvesTo: [],
        profile: { mobility: 3, stealth: 2, resilience: 2, control: 4, support: 2, range: 5 },
        actions: [
          {
            id: "acid_spit",
            name: "Crachat acide",
            type: "attack",
            description: "Projette une salve corrosive précise sur une cible moyenne distance."
          },
          {
            id: "corrosive_pool",
            name: "Flaque corrosive",
            type: "area",
            description: "Crée une zone temporaire qui endommage armure et mécanique."
          },
          {
            id: "acid_mark",
            name: "Marquage dissolvant",
            type: "debuff",
            description: "Fragilise une porte ou un boss pour les attaques de mêlée."
          },
          {
            id: "retreat_spit",
            name: "Jet de retraite",
            type: "defense",
            description: "Dépose une ligne acide courte en reculant."
          }
        ],
        strengths: ["Seule caste principale à distance", "Détruit l'armure", "Sépare les groupes"],
        weaknesses: ["Réserve acide limitée", "Fragile au corps à corps", "Peut perforer accidentellement la coque"],
        counters: ["Bouclier thermique", "Rush de mêlée", "Ventilation des vapeurs"]
      },
      praetorian: {
        id: "praetorian",
        name: "Praetorian",
        priority: "P1",
        loreStatus: "EXPANDED_COMPATIBLE",
        role: "Garde royal et relais de commandement",
        evolutionFrom: ["warrior_royal_molt", "drone_royal_molt"],
        evolvesTo: ["queen_optional_succession"],
        profile: { mobility: 3, stealth: 1, resilience: 5, control: 4, support: 4, range: 0 },
        actions: [
          {
            id: "royal_charge",
            name: "Charge royale",
            type: "attack",
            description: "Charge frontale qui renverse les lignes et endommage les exosquelettes."
          },
          {
            id: "crest_guard",
            name: "Garde de crête",
            type: "defense",
            description: "Oriente la carapace frontale pour protéger la caste royale derrière lui."
          },
          {
            id: "rally_scream",
            name: "Cri de ralliement",
            type: "command",
            description: "Augmente brièvement vitesse et ténacité des unités proches."
          },
          {
            id: "royal_intercept",
            name: "Interception",
            type: "reaction",
            description: "S'interpose lorsqu'une attaque lourde cible la Reine."
          }
        ],
        strengths: ["Armure frontale exceptionnelle", "Commandement local", "Protection de la Reine"],
        weaknesses: ["Grande cible", "Flancs exposés pendant une charge", "Coût biologique élevé"],
        counters: ["Attaque de flanc", "Piège hydraulique", "Feu concentré sur les articulations"]
      },
      queen: {
        id: "queen",
        name: "Reine",
        priority: "P0",
        loreStatus: "FILM_CORE",
        role: "Cœur reproducteur et commandement stratégique",
        evolutionFrom: ["royal_embryo", "praetorian_optional_succession"],
        evolvesTo: ["ovomorphe"],
        profile: { mobility: 2, stealth: 0, resilience: 5, control: 5, support: 5, range: 1 },
        actions: [
          {
            id: "lay_egg",
            name: "Ponte",
            type: "production",
            description: "Transforme les réserves organiques en Ovomorphe ; nécessite un ovipositeur fonctionnel."
          },
          {
            id: "synaptic_command",
            name: "Directive synaptique",
            type: "command",
            description: "Place un ordre phéromonal de chasse, capture, défense ou infestation."
          },
          {
            id: "royal_call",
            name: "Appel royal",
            type: "command",
            description: "Rappelle les gardes proches et réveille les œufs menacés."
          },
          {
            id: "detach_ovipositor",
            name: "Rupture de l'ovipositeur",
            type: "transform",
            description: "Rend la Reine mobile et redoutable, mais suspend toute ponte."
          },
          {
            id: "royal_rend",
            name: "Déchirement royal",
            type: "attack",
            description: "Combo de bras, griffes et queue contre une cible lourde."
          }
        ],
        strengths: ["Production d'œufs", "Commandement global", "Puissance de boss lorsqu'elle est mobile"],
        weaknesses: ["Ovipositeur immobile", "Perte catastrophique pour la colonie", "Grande cible"],
        counters: ["Exosquelette industriel", "Autodestruction", "Attaque coordonnée sur l'ovipositeur"]
      }
    },

    // =========================================================================
    // [ENNEMIS] Archétypes originaux et contre-jeu par fonction
    // =========================================================================

    enemies: {
      maintenance_technician: {
        id: "maintenance_technician",
        name: "Technicien de maintenance",
        faction: "Personnel MNEMOSYNE",
        hostEligibility: "viable",
        threat: 1,
        behaviors: ["Fuit", "Répare une porte", "Déclenche une alarme locale"],
        equipment: ["Lampe de travail", "Clé à choc"],
        weaknesses: ["Panique rapide", "Aucune armure"]
      },
      xenobiologist: {
        id: "xenobiologist",
        name: "Xénobiologiste IRISE",
        faction: "Consortium IRISE",
        hostEligibility: "viable",
        threat: 1,
        behaviors: ["Observe à distance", "Active les scanners", "Cherche à capturer plutôt qu'à tuer"],
        equipment: ["Scanner biologique", "Injecteur sédatif"],
        weaknesses: ["Faible au corps à corps", "Suit un protocole prévisible"]
      },
      security_agent: {
        id: "security_agent",
        name: "Agent de sûreté",
        faction: "Sûreté MNEMOSYNE",
        hostEligibility: "viable",
        threat: 2,
        behaviors: ["Patrouille", "Éclaire les angles", "Appelle un renfort"],
        equipment: ["Carabine cinétique R-9", "Balise lumineuse"],
        weaknesses: ["Champ de vision limité", "Vulnérable depuis le plafond"]
      },
      orbital_rifleman: {
        id: "orbital_rifleman",
        name: "Fusilier orbital",
        faction: "Détachement KAPPA",
        hostEligibility: "viable",
        threat: 3,
        behaviors: ["Progresse en binôme", "Tir de suppression", "Surveille les signaux mobiles"],
        equipment: ["Fusil automatique K-12", "Détecteur inertiel"],
        weaknesses: ["Le détecteur produit de faux échos dans la résine", "Flanc arrière peu couvert"]
      },
      thermal_operator: {
        id: "thermal_operator",
        name: "Opérateur thermique",
        faction: "Détachement KAPPA",
        hostEligibility: "viable",
        threat: 4,
        behaviors: ["Brûle les structures", "Bloque un corridor", "Protège les autres fusiliers"],
        equipment: ["Lance thermique T-4", "Réservoir dorsal"],
        weaknesses: ["Réservoir vulnérable", "Portée inefficace au-delà d'un corridor"]
      },
      gyro_gunner: {
        id: "gyro_gunner",
        name: "Artilleur gyrostabilisé",
        faction: "Détachement KAPPA",
        hostEligibility: "viable",
        threat: 4,
        behaviors: ["Suit une cible mobile", "Couvre un large cône", "Interrompt les charges"],
        equipment: ["Canon gyrostabilisé VIGIE", "Visière de suivi"],
        weaknesses: ["Rotation lente à courte portée", "Dépend de sa visière"]
      },
      capture_commando: {
        id: "capture_commando",
        name: "Commando de récupération",
        faction: "Consortium IRISE",
        hostEligibility: "protected",
        threat: 4,
        behaviors: ["Pose un piège", "Immobilise une petite caste", "Extrait une cible vivante"],
        equipment: ["Masque étanche", "Perche de contention", "Filet électrostatique"],
        weaknesses: ["Masque destructible", "Peu de dégâts directs"]
      },
      argos_synthetic: {
        id: "argos_synthetic",
        name: "Synthétique ARGOS",
        faction: "Consortium IRISE",
        hostEligibility: "none",
        threat: 4,
        behaviors: ["Ignore la panique", "Répare une tourelle", "Poursuit sans bruit"],
        equipment: ["Pinces industrielles", "Interface de maintenance"],
        weaknesses: ["Articulations sensibles à l'acide", "Peut être détourné par PALIMPSESTE"]
      },
      sentry_turret: {
        id: "sentry_turret",
        name: "Tourelle SENTINELLE",
        faction: "Défense automatisée",
        hostEligibility: "none",
        threat: 3,
        behaviors: ["Balayage périodique", "Verrouillage", "Tir jusqu'à surchauffe"],
        equipment: ["Capteur optique", "Magasin limité"],
        weaknesses: ["Angle mort arrière", "Alimentation exposée", "Surchauffe"]
      },
      security_drone: {
        id: "security_drone",
        name: "Drone de sûreté LUCIOLE",
        faction: "Défense automatisée",
        hostEligibility: "none",
        threat: 2,
        behaviors: ["Marque une cible", "Éclaire les plafonds", "Guide les fusiliers"],
        equipment: ["Projecteur UV", "Balise de pistage"],
        weaknesses: ["Très fragile", "Signal détectable à travers les murs"]
      }
    },

    // =========================================================================
    // [BOSS] Rencontres originales à phases et solutions systémiques
    // =========================================================================

    bosses: {
      ASTER_RHO: {
        id: "ASTER_RHO",
        name: "Surveillante Aster Rho",
        title: "Cheffe du confinement biologique",
        actId: "ACT_2",
        hostEligibility: "protected_then_viable",
        arena: "Bloc médical à cloisons mobiles",
        phases: [
          {
            index: 1,
            name: "Protocole étanche",
            mechanics: ["Masque facial inviolé", "Perche de contention", "Cloisons alternées"]
          },
          {
            index: 2,
            name: "Respiration exposée",
            trigger: "Destruction des deux attaches du masque",
            mechanics: ["Course vers la sortie", "Appel d'un drone LUCIOLE", "Fenêtre d'agrippement"]
          }
        ],
        defeatCondition: "Détruire le masque, isoler la cible puis réussir l'implantation.",
        narrativePurpose: "Apprendre qu'un hôte protégé exige une préparation et non un simple bond."
      },
      BRIAREOS_7: {
        id: "BRIAREOS_7",
        name: "BRIAREOS-7",
        title: "Synthétique de siège",
        actId: "ACT_5",
        hostEligibility: "none",
        arena: "Fonderie gravitationnelle",
        phases: [
          {
            index: 1,
            name: "Ancrage",
            mechanics: ["Bras de saisie", "Réparation automatique", "Plaques résistantes aux griffes"]
          },
          {
            index: 2,
            name: "Démembrement",
            trigger: "Marquage acide de deux articulations",
            mechanics: ["Bras destructibles", "Jets de fluide chaud", "Poursuite accélérée"]
          }
        ],
        defeatCondition: "Employer le Spitter pour fragiliser les articulations puis charger avec un Praetorian.",
        narrativePurpose: "Imposer une coopération de castes et rappeler qu'un synthétique ne peut servir d'hôte."
      },
      MANTIS_4: {
        id: "MANTIS_4",
        name: "MANTIS-4",
        title: "Exosquelette industriel de quarantaine",
        actId: "ACT_5",
        hostEligibility: "operator_inside",
        arena: "Baie d'arrimage d'ÉCHO-12",
        phases: [
          {
            index: 1,
            name: "Pinces hydrauliques",
            mechanics: ["Saisie de la Reine", "Projection", "Protection frontale"]
          },
          {
            index: 2,
            name: "Circuit ouvert",
            trigger: "Destruction de deux conduites hydrauliques",
            mechanics: ["Sol glissant", "Arc électrique", "Opératrice partiellement exposée"]
          },
          {
            index: 3,
            name: "Dernier verrou",
            trigger: "Rupture du blindage dorsal",
            mechanics: ["Charge désespérée", "Décompression intermittente", "Exécution royale possible"]
          }
        ],
        defeatCondition: "Attaquer de plusieurs hauteurs, rompre l'hydraulique puis atteindre le blindage dorsal.",
        narrativePurpose: "Offrir un duel final lisible sans reprendre un personnage ou un véhicule historique."
      },
      PALIMPSESTE: {
        id: "PALIMPSESTE",
        name: "PALIMPSESTE",
        title: "Intelligence de gestion de MNEMOSYNE",
        actId: "ACT_5",
        hostEligibility: "none",
        arena: "Toute la station",
        phases: [
          {
            index: 1,
            name: "Effacement",
            mechanics: ["Caméras", "Portes", "Faux ordres d'évacuation"]
          },
          {
            index: 2,
            name: "Purge",
            trigger: "Infestation de quatre relais",
            mechanics: ["Gaz", "Vide", "Surchauffe des secteurs"]
          },
          {
            index: 3,
            name: "Autodestruction",
            trigger: "Perte du contrôle des vannes",
            mechanics: ["Compte à rebours", "Choix d'une fin", "Routes mutuellement exclusives"]
          }
        ],
        defeatCondition: "Infester ses relais physiques et choisir ce que la ruche fera du réacteur.",
        narrativePurpose: "Transformer l'environnement en adversaire final et relier directement les trois fins."
      }
    },

    // =========================================================================
    // [CODEX] Entrées originales déverrouillables
    // =========================================================================

    codex: {
      categories: {
        biology: "Biologie",
        hive: "Ruche",
        station: "MNEMOSYNE",
        opposition: "Opposition",
        archives: "Archives"
      },
      entries: [
        {
          id: "codex_mnemosyne",
          category: "station",
          title: "Station MNEMOSYNE",
          body:
            "Ancienne raffinerie reconvertie en laboratoire. Ses secteurs tournants rendent les communications " +
            "instables et créent de nombreux conduits oubliés.",
          unlock: { type: "mission", targetId: "P_M01" }
        },
        {
          id: "codex_irise",
          category: "archives",
          title: "Consortium IRISE",
          body:
            "Groupement privé spécialisé dans la récupération biologique. Ses contrats récompensent la capture " +
            "d'un organisme intact, même lorsque sa destruction serait plus sûre.",
          unlock: { type: "mission", targetId: "P_M01" }
        },
        {
          id: "codex_ovomorphe",
          category: "biology",
          title: "Ovomorphe",
          body:
            "Incubateur dormant capable de comparer chaleur, mouvement et vibration avant de risquer son unique ouverture.",
          unlock: { type: "mission", targetId: "A1_M01" }
        },
        {
          id: "codex_sens_biologique",
          category: "biology",
          title: "Perception sans regard",
          body:
            "Les réponses de l'organisme suggèrent une combinaison de lecture thermique, pression et chimie de l'air. " +
            "Le laboratoire n'a jamais isolé un organe unique.",
          unlock: { type: "objective", targetId: "scan_room" }
        },
        {
          id: "codex_facehugger",
          category: "biology",
          title: "Facehugger",
          body:
            "Forme mobile spécialisée dans l'agrippement et l'implantation. Sa réussite dépend de la durée de la lutte, " +
            "de l'accès au visage et de la viabilité de l'hôte.",
          unlock: { type: "caste", targetId: "facehugger" }
        },
        {
          id: "codex_confinement",
          category: "opposition",
          title: "Doctrine KAPPA",
          body:
            "Le détachement combine lumière, contention et feu. La perche neutralise les petites formes ; " +
            "la destruction du masque transforme toutefois son opérateur en hôte viable.",
          unlock: { type: "enemySeen", targetId: "capture_commando" }
        },
        {
          id: "codex_empreinte_hote",
          category: "biology",
          title: "Empreinte de l'hôte",
          body:
            "La morphologie adulte conserve des propriétés utiles de l'organisme incubateur. " +
            "Sur LV-X91, ce phénomène détermine surtout mobilité et robustesse.",
          unlock: { type: "mission", targetId: "A2_M02" }
        },
        {
          id: "codex_chestburster",
          category: "biology",
          title: "Chestburster",
          body:
            "Le juvénile privilégie la fuite. Il dépense ses réserves dans une croissance rapide et ne possède " +
            "ni l'armure ni la force de la forme adulte.",
          unlock: { type: "caste", targetId: "chestburster" }
        },
        {
          id: "codex_sang_acide",
          category: "biology",
          title: "Pression corrosive",
          body:
            "Une blessure grave projette un fluide extrêmement corrosif. Dans une station, tuer la créature " +
            "peut être aussi dangereux que la laisser fuir.",
          unlock: { type: "event", targetId: "acid.first_environment_damage" }
        },
        {
          id: "codex_mue",
          category: "biology",
          title: "Mue accélérée",
          body:
            "La chrysalide concentre chaleur et matière autour du juvénile. La transformation est rapide, " +
            "mais rend l'organisme immobile et vulnérable.",
          unlock: { type: "mission", targetId: "A3_M02" }
        },
        {
          id: "codex_drone",
          category: "biology",
          title: "Drone",
          body:
            "Prédateur polyvalent adapté aux conduits, aux plafonds et à l'enlèvement d'organismes vivants.",
          unlock: { type: "caste", targetId: "drone" }
        },
        {
          id: "codex_runner",
          category: "biology",
          title: "Runner",
          body:
            "Forme quadrupède dont la vitesse et la silhouette basse favorisent les longues poursuites.",
          unlock: { type: "caste", targetId: "runner" }
        },
        {
          id: "codex_warrior",
          category: "biology",
          title: "Warrior",
          body:
            "Spécialisation d'assaut observée près des structures de ruche. Sa carapace supporte mieux le tir frontal.",
          unlock: { type: "caste", targetId: "warrior" }
        },
        {
          id: "codex_reseau_securite",
          category: "station",
          title: "Réseau SENTINELLE",
          body:
            "Caméras, tourelles et drones partagent des relais physiques. Couper un relais crée un angle mort, " +
            "mais avertit PALIMPSESTE.",
          unlock: { type: "mission", targetId: "A4_M01" }
        },
        {
          id: "codex_nursery",
          category: "hive",
          title: "Nursery",
          body:
            "Une nursery viable exige des hôtes vivants, une température stable, des surfaces de résine " +
            "et une route protégée pour les Workers.",
          unlock: { type: "mission", targetId: "A4_M02" }
        },
        {
          id: "codex_spitter",
          category: "biology",
          title: "Spitter",
          body:
            "Spécialisation de soutien capable de projeter sa réserve corrosive. Elle ne remplace pas le Drone " +
            "et risque d'endommager la coque.",
          unlock: { type: "caste", targetId: "spitter" }
        },
        {
          id: "codex_worker",
          category: "biology",
          title: "Worker",
          body:
            "Constructeur de la colonie. Il entretient résine, œufs et cocons et doit être protégé par les castes de combat.",
          unlock: { type: "caste", targetId: "worker" }
        },
        {
          id: "codex_economie_ruche",
          category: "hive",
          title: "Économie organique",
          body:
            "La biomasse nourrit la ponte et la construction. Une unité adulte requiert toujours un cycle complet " +
            "et un hôte approprié.",
          unlock: { type: "mission", targetId: "A4_M03" }
        },
        {
          id: "codex_praetorian",
          category: "biology",
          title: "Praetorian",
          body:
            "Garde royal massif servant à la fois de bouclier, de briseur de ligne et de relais synaptique.",
          unlock: { type: "caste", targetId: "praetorian" }
        },
        {
          id: "codex_queen",
          category: "biology",
          title: "Reine",
          body:
            "Centre reproducteur de la colonie. Elle doit choisir entre rester reliée à la ponte ou rompre " +
            "l'ovipositeur pour défendre physiquement la ruche.",
          unlock: { type: "caste", targetId: "queen" }
        },
        {
          id: "codex_palimpseste",
          category: "station",
          title: "PALIMPSESTE",
          body:
            "L'intelligence de gestion réécrit ses propres archives afin d'obéir aux ordres contradictoires d'IRISE. " +
            "Ses relais restent cependant matériels et peuvent être infestés.",
          unlock: { type: "bossSeen", targetId: "PALIMPSESTE" }
        },
        {
          id: "codex_archives_complete",
          category: "archives",
          title: "Ce que la station a effacé",
          body:
            "MNEMOSYNE n'a pas été victime d'un accident isolé. IRISE avait préparé plusieurs protocoles " +
            "de récupération avant même l'arrivée d'ÉCHO-12.",
          unlock: { type: "campaignComplete", targetId: "any" }
        }
      ]
    },

    // =========================================================================
    // [JOURNAUX] Documents narratifs entièrement originaux
    // =========================================================================

    journals: [
      {
        id: "journal_01",
        title: "Manifeste amendé",
        author: "Capitaine Mara Sen",
        location: "ÉCHO-12, passerelle",
        timestamp: "Cycle 01 — 03:14",
        text:
          "Le conteneur n'était pas sur la liste quand nous avons quitté Nysa. IRISE a doublé la prime " +
          "et interdit tout scan actif. Je n'aime pas transporter quelque chose dont même le client refuse de prononcer le nom.",
        unlock: { type: "mission", targetId: "P_M01" }
      },
      {
        id: "journal_02",
        title: "Réponse à la chaleur",
        author: "Analyste Soren Vale",
        location: "Incubateur 3",
        timestamp: "Cycle 01 — 08:42",
        text:
          "La coquille ne réagit pas au mouvement du bras robotique, mais elle s'ouvre d'un millimètre " +
          "quand un technicien entre dans la pièce. Elle distingue donc la machine de l'organique. " +
          "La question n'est plus de savoir si elle perçoit, mais ce qu'elle attend.",
        unlock: { type: "mission", targetId: "A1_M01" }
      },
      {
        id: "journal_03",
        title: "Bruit sous le plancher",
        author: "Technicienne Lio Paren",
        location: "Niveau médical",
        timestamp: "Cycle 01 — 09:07",
        text:
          "Trois capteurs se déclenchent dans l'ordre inverse du flux d'air. La maintenance parle d'un faux contact. " +
          "Un faux contact ne s'arrête pas devant chaque grille comme s'il cherchait son chemin.",
        unlock: { type: "mission", targetId: "A2_M01" }
      },
      {
        id: "journal_04",
        title: "Ordre de capture",
        author: "Surveillante Aster Rho",
        location: "Canal KAPPA chiffré",
        timestamp: "Cycle 01 — 09:11",
        text:
          "Priorité absolue à la récupération vivante. Le feu n'est autorisé qu'après perte du bloc médical. " +
          "IRISE considère chaque organisme comme une propriété contractuelle ; je considère mes agents comme des êtres vivants. " +
          "Pour l'instant, ces deux règles sont incompatibles.",
        unlock: { type: "mission", targetId: "A2_M02" }
      },
      {
        id: "journal_05",
        title: "L'échangeur condamné",
        author: "PALIMPSESTE",
        location: "Journal de maintenance automatique",
        timestamp: "Cycle 01 — 11:26",
        text:
          "Hausse thermique localisée dans l'échangeur D-6. La commande d'inspection a été annulée par IRISE, " +
          "puis effacée de l'historique humain. Copie conservée dans la mémoire de sûreté.",
        unlock: { type: "mission", targetId: "A3_M02" }
      },
      {
        id: "journal_06",
        title: "Ils observent",
        author: "Agent Nima Orr",
        location: "Poste de sûreté nord",
        timestamp: "Cycle 02 — 00:18",
        text:
          "La chose aurait pu me tuer quand la lumière s'est coupée. Elle a pris mon arme et m'a laissé courir. " +
          "Deux heures plus tard, le relais que j'ai utilisé pour appeler du secours a disparu dans la résine. " +
          "Ce n'était pas de la chance. Elle apprenait.",
        unlock: { type: "mission", targetId: "A4_M01" }
      },
      {
        id: "journal_07",
        title: "Comptage des absents",
        author: "Médecin Ada Kest",
        location: "Infirmerie auxiliaire",
        timestamp: "Cycle 02 — 02:03",
        text:
          "Les équipes annoncent douze morts, mais je ne trouve que cinq corps. Les autres balises avancent lentement " +
          "vers la raffinerie, toutes à la même hauteur. Nous ne cherchons plus des survivants. Nous suivons un convoi.",
        unlock: { type: "mission", targetId: "A4_M03" }
      },
      {
        id: "journal_08",
        title: "Directive d'effacement",
        author: "Directrice Elian Torv",
        location: "Bureau de quarantaine",
        timestamp: "Cycle 02 — 04:49",
        text:
          "Si MNEMOSYNE tombe, PALIMPSESTE doit détruire la station, ses archives et tout témoin. " +
          "Le Conseil veut pouvoir qualifier LV-X91 d'accident industriel. J'ai signé. " +
          "Je comprends enfin pourquoi cette station porte le nom de la mémoire : chacun ici travaille à la faire disparaître.",
        unlock: { type: "mission", targetId: "A5_M01" }
      }
    ],

    // =========================================================================
    // [FINS] Trois conclusions jouables et mutuellement exclusives
    // =========================================================================

    endings: {
      ENDING_DOMINION: {
        id: "ENDING_DOMINION",
        title: "Le palais des archives",
        tone: "Victoire territoriale",
        choiceLabel: "Étouffer le réacteur et conserver MNEMOSYNE",
        requirements: [
          "Reine vivante et reliée à un ovipositeur",
          "Quatre secteurs intégralement infestés",
          "PALIMPSESTE isolé du réacteur",
          "Au moins une nursery active"
        ],
        finalObjectives: [
          "Envoyer les Workers refroidir le cœur",
          "Défendre l'ovipositeur pendant la dernière purge",
          "Détruire l'antenne longue portée"
        ],
        epilogue:
          "Les feux industriels s'éteignent un à un. MNEMOSYNE continue de tourner, mais ses corridors " +
          "ne transportent plus de minerai. La station entière respire au rythme de la Reine, invisible depuis les routes de Nysa.",
        unlocks: ["mode_hive_survival", "codex_archives_complete"]
      },
      ENDING_EXODUS: {
        id: "ENDING_EXODUS",
        title: "La semence voyageuse",
        tone: "Victoire de propagation",
        choiceLabel: "Abandonner la station et contaminer ÉCHO-12",
        requirements: [
          "Un Ovomorphe royal transportable",
          "Baie d'arrimage accessible",
          "Scanner de cargaison désactivé",
          "MANTIS-4 neutralisé"
        ],
        finalObjectives: [
          "Escorter un Worker portant l'œuf",
          "Maintenir les portes de la baie ouvertes",
          "Détacher ÉCHO-12 avant l'explosion"
        ],
        epilogue:
          "LV-X91 devient une étoile brève derrière le remorqueur. Son manifeste automatique ne déclare " +
          "aucun passager et une seule caisse vide. Dans la soute froide, quelque chose répond déjà à la chaleur du prochain équipage.",
        unlocks: ["new_game_plus_host_routes", "codex_archives_complete"]
      },
      ENDING_ASHES: {
        id: "ENDING_ASHES",
        title: "Mémoire de cendre",
        tone: "Victoire sacrificielle",
        choiceLabel: "Retourner l'autodestruction contre IRISE",
        requirements: [
          "Archives du Consortium entièrement découvertes",
          "Conduites corrosives ouvertes vers le réacteur",
          "Embryon royal de secours placé dans une capsule minière",
          "PALIMPSESTE maintenu en ligne jusqu'au dernier instant"
        ],
        finalObjectives: [
          "Attirer les renforts IRISE dans MNEMOSYNE",
          "Verrouiller leurs appareils à quai",
          "Libérer la capsule avant la fusion du cœur"
        ],
        epilogue:
          "Le Consortium perd sa flotte de récupération et toutes les preuves qu'il voulait posséder. " +
          "Des semaines plus tard, une capsule minière dérive au-delà de Nysa. Sa batterie est morte, " +
          "mais ce qu'elle protège n'a besoin ni de lumière ni de mémoire.",
        unlocks: ["mode_iron_cycle", "codex_archives_complete"]
      }
    }
  };

  // ===========================================================================
  // [UTILITAIRE] Protection du catalogue contre les mutations accidentelles
  // ===========================================================================

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
  }

  // ===========================================================================
  // [EXPORT GLOBAL] API de contenu consommable par le prototype sans bundler
  // ===========================================================================

  window.HIVE_CONTENT = deepFreeze(HIVE_CONTENT);
})();
