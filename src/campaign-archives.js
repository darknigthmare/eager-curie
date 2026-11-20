/* global window */

(() => {
  "use strict";

  const base = window.HIVE_CONTENT;

  const additionalCodex = [
        {
          id: "codex_reflexe_adn",
          category: "biology",
          title: "Réflexe ADN (Adaptation Hôte)",
          body:
            "L'embryon XX121 assimile immédiatement des séquences structurelles de son hôte durant la gestation, " +
            "adaptant sa morphologie finale (bipède, quadrupède ou hybride) au biotope de la station.",
          unlock: { type: "event", targetId: "dna_reflex" }
        },
        {
          id: "codex_castes_etendues",
          category: "biology",
          title: "Castes Étendues de la Ruche",
          body:
            "Sous pression tactique prolongée, la lignée royale différencie des phénotypes spécialisés : " +
            "Crusher blindé, Prowler embusqué, Spitter acide, Praetorian et Garde Palatine.",
          unlock: { type: "event", targetId: "extended_castes" }
        },
        {
          id: "codex_protocole_kappa",
          category: "station",
          title: "Protocole KAPPA (Exosquelettes MANTIS-4)",
          body:
            "Mesure ultime d'IRISE : déploiement des exosquelettes de confinement KAPPA et de l'unité " +
            "MANTIS-4 à bouclier cinétique pour purger la nurserie avant l'effondrement des relais.",
          unlock: { type: "bossSeen", targetId: "MANTIS_4" }
        },
        {
          id: "codex_weyland_curie07",
          category: "station",
          title: "Station Curie-07 (Mnemosyne)",
          body:
            "Station de recherche orbitale clandestine de la division Biomatériaux et Armement Spécial Weyland-Yutani. " +
            "Placée en orbite haute du géant gazeux KG-348, Curie-07 opère sous couverture de raffinerie civile " +
            "pour étudier des souches xénomorphiques hautement agressives loin de toute surveillance coloniale.",
          unlockedByDefault: true,
          unlock: { type: "default" }
        },
        {
          id: "codex_specimen_xx121_respiration",
          category: "biology",
          title: "Spécimen XX121 — Métabolisme & Anoxie",
          body:
            "Les autopsies du Dr Aris Thorne confirment l'absence d'appareil alvéolaire pulmonaire. " +
            "La respiration cellulaire est régie par une matrice de silicates polarisés et un circuit acide fluorosulfurique. " +
            "L'organisme est totalement invulnérable au gaz asphyxiant Halon 1301 et peut survivre en dépressurisation orbitale totale.",
          unlockedByDefault: true,
          unlock: { type: "default" }
        },
        {
          id: "codex_order_937",
          category: "archives",
          title: "Directive Spéciale 937 (Weyland-Yutani)",
          body:
            "Ordre prioritaire absolu gravé en ROM dans l'unité centrale APOLLO : " +
            "\"Garantir impérativement la récupération et l'isolement du spécimen intact pour analyse et rapatriement. " +
            "Toutes autres considérations de sécurité ou de sauvetage sont révoquées. Personnel et équipage sacrifiables.\"",
          unlockedByDefault: true,
          unlock: { type: "default" }
        },
        {
          id: "codex_halon_atmosphere",
          category: "station",
          title: "Extinction Industrielle Halon 1301",
          body:
            "Dispositif automatisé d'extinction d'incendie par détente brutale de bromochlorodifluorométhane. " +
            "Chute le taux d'O2 ambiant de 20.9% à moins de 4.5% en 2.8 secondes. " +
            "Provoque l'hypoxie létale des colons en détresse, tout en offrant un brouillard de camouflage thermique idéal pour le Xénomorphe.",
          unlockedByDefault: true,
          unlock: { type: "default" }
        },
        {
          id: "codex_cryo_stasis_tech",
          category: "station",
          title: "Caissons Cryogéniques Weyland Stasis Mk.IV",
          body:
            "Unités de biostase à double vérin hydraulique et circuit d'azote liquide LN2 à -180°C. " +
            "Conçues pour la conservation cryogénique des embryons et des hôtes humains. " +
            "Une verrière fracturée déclenche une vaporisation d'azote, un décalque givré au sol et un choc d'hypothermie instantané.",
          unlockedByDefault: true,
          unlock: { type: "default" }
        },
        {
          id: "codex_seegson_ap7",
          category: "opposition",
          title: "Androïde Seegson Working Joe AP-7",
          body:
            "Synthétique industriel lourd revêtu de caoutchouc isolant. " +
            "Doté d'une force hydraulique colossale et insensible aux toxines, il est reprogrammé sous directive de quarantaine " +
            "pour sceller les issues et éliminer toute interférence civile.",
          unlockedByDefault: true,
          unlock: { type: "default" }
        },
        {
          id: "codex_hive_mind_resonance",
          category: "biology",
          title: "Réseau Synaptique & Résonance de la Reine",
          body:
            "Les sécrétions de bio-résine de la Ruche ne constituent pas qu'un matériau structurel : elles forment un réseau " +
            "conducteur de vibrations acoustiques subsoniques et de phéromones volatiles. Toute intrusion dans la résine " +
            "alerte instantanément la Matriarche et coordonne les castes guerrières à travers les conduits de Curie-07.",
          unlockedByDefault: true,
          unlock: { type: "default" }
        },
        {
          id: "codex_apollo_self_destruct",
          category: "archives",
          title: "Protocole d'Autodestruction Apollo / Réacteur",
          body:
            "Procédure de stérilisation thermonucléaire gravée dans les noyaux d'urgence de la station Mnemosyne. " +
            "En cas de rupture définitive du confinement de Classe 5, l'IA centrale amorce la surcharge du cœur à fusion " +
            "pour désintégrer la station en orbite de KG-348, à moins que l'essaim ne sectionne les relais synaptiques.",
          unlockedByDefault: true,
          unlock: { type: "default" }
        }
  ];
  const additionalJournals = [
      {
        id: "journal_dr_thorne_01",
        title: "Dissection XX121 — Note 42",
        author: "Dr Aris Thorne (Chef Xénobiologie)",
        location: "Curie-07, Laboratoire Confiné B",
        timestamp: "Cycle 01 — 11:22",
        text:
          "L'exosquelette n'est pas fait de chitine animale terrestre, mais d'une matrice complexe de polymères de silicium " +
          "et de protéines ultra-denses. Le sang agit comme une batterie électrochimique concentrée d'acide fluorosulfurique. " +
          "Même plongé dans une atmosphère saturée d'Halon 1301 sans oxygène, les tissus musculaires continuent de réagir. " +
          "Cet organisme ne respire pas... il transcende les limites de la biologie connue.",
        unlockedByDefault: true,
        unlock: { type: "default" }
      },
      {
        id: "journal_vasquez_halon_vent",
        title: "Pression Halon & Rupture Grilles",
        author: "Elena Vasquez (Ingénieur Systèmes)",
        location: "Pont Industriel - Salle des pompes",
        timestamp: "Cycle 01 — 14:05",
        text:
          "Les manomètres des générateurs de Halon 1301 s'affolent dans les sous-sections 3 et 4. " +
          "Des chutes de pression brutales sont enregistrées près des conduits de ventilation principaux. " +
          "Quelque chose a tordu les grilles en acier renforcé depuis l'intérieur du conduit technique. " +
          "J'ai prévenu la sécurité, mais les synthétiques Working Joe répètent en boucle que tout est sous contrôle...",
        unlockedByDefault: true,
        unlock: { type: "default" }
      },
      {
        id: "journal_orson_transmission",
        title: "Transmission Prioritaire Ordre 937",
        author: "Directeur de Sécurité Orson",
        location: "Poste de Commandement Central",
        timestamp: "Cycle 01 — 16:50",
        text:
          "Message chiffré reçu du siège de Weyland-Yutani : 'Nous avons pris acte de la brèche de confinement. " +
          "Aucun vaisseau d'évacuation ne sera dépêché tant que l'échantillon vivant n'est pas sécurisé dans le module étanche. " +
          "Vous avez ordre de purger au gaz inerte et de verrouiller les portes étanches.' Ils nous abandonnent ici avec le prédateur.",
        unlockedByDefault: true,
        unlock: { type: "default" }
      },
      {
        id: "journal_seegson_log_ap7",
        title: "Journal d'Incident Synthétique AP-7",
        author: "Unité Seegson Working Joe #284",
        location: "Secteur Sas Cryogénique",
        timestamp: "Cycle 01 — 19:15",
        text:
          "Directive APOLLO reçue : Maintenir les portes étanches closes. Des ouvriers civils tentent de forcer l'accès au sas médical. " +
          "Notification vocale émise : 'Vous perturbez les opérations de la station'. Recours à la force motrice appliqué. " +
          "La température de la salle cryogénique chute brutalement. Le spécimen biologique a été aperçu rampant sur les poutrelles du plafond.",
        unlockedByDefault: true,
        unlock: { type: "default" }
      },
      {
        id: "journal_hull_breach_09",
        title: "Brèche Acide Pont C — Gravité Zéro",
        author: "Technicien K. Mercer",
        location: "Pont C — Zone d'Inversion Gravitationnelle",
        timestamp: "Cycle 01 — 22:14",
        text:
          "Lorsque l'escouade de sécurité a tiré sur le spécimen près des bobines Zéro-G, son sang n'est pas tombé au sol. " +
          "Des sphères d'acide fluo-sulfurique se sont mises à dériver lentement dans la coursive. Deux d'entre elles ont " +
          "traversé le caillebotis et rongé trois ponts successifs jusqu'au conduit de maintenance inférieur. Il s'en est servi pour fuir.",
        unlockedByDefault: true,
        unlock: { type: "default" }
      },
      {
        id: "journal_dockyard_p5000",
        title: "Soute Cargo — Manœuvre Caterpillar P-5000",
        author: "Chef de Quai D. Vance",
        location: "Baie d'Amarrage 02",
        timestamp: "Cycle 02 — 01:38",
        text:
          "Les armes légères ne suffisent plus face aux castes blindées qui gardent la Reine. J'ai démarré l'exosquelette " +
          "Caterpillar P-5000 et soudé la passerelle d'évacuation au chalumeau industriel. Si la créature approche à moins de trois mètres, " +
          "les pinces hydrauliques peuvent encore la broyer... à condition qu'elle ne tranche pas les flexibles avec sa queue.",
        unlockedByDefault: true,
        unlock: { type: "default" }
      }
  ];

  for (const entry of [...additionalCodex, ...additionalJournals]) {
    Object.freeze(entry.unlock);
    Object.freeze(entry);
  }

  window.HIVE_CONTENT = Object.freeze({
    ...base,
    codex: Object.freeze({
      ...base.codex,
      entries: Object.freeze([...base.codex.entries, ...additionalCodex])
    }),
    journals: Object.freeze([...base.journals, ...additionalJournals])
  });
})();
