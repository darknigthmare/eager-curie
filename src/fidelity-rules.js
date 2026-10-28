/* Biological rules shared by player actions, host selection and the nursery.
 * FILM_CORE describes the reference, not proof that every game stat is film canon.
 * The numerical distances and the playable specializations remain game adaptations.
 */
(() => {
  'use strict';

  const freeze = (value) => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  const keyOf = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const makeProfile = (id, loreStatus, traits = {}) => ({
    id, loreStatus, referenceLabel: loreStatus === 'FILM_CORE' ? 'Référence filmique' : 'Interprétation de jeu',
    acidBlood: true, acidSpit: false, naturalHiveCaste: true, ...traits
  });

  const profiles = {
    ovomorphe: makeProfile('ovomorphe', 'FILM_CORE', { stage: 'egg', mobile: false }),
    facehugger: makeProfile('facehugger', 'FILM_CORE', { stage: 'parasite', needsOrganicHost: true }),
    chestburster: makeProfile('chestburster', 'FILM_CORE', { stage: 'juvenile', combatReady: false }),
    drone: makeProfile('drone', 'FILM_CORE', { stage: 'adult', hostMorphology: 'human' }),
    runner: makeProfile('runner', 'FILM_CORE', { stage: 'adult', hostMorphology: 'quadruped' }),
    warrior: makeProfile('warrior', 'EXPANDED_COMPATIBLE', {
      stage: 'adult', referenceLabel: 'Silhouette filmique ; caste et évolution adaptées',
      note: 'Une armure portée par un humain ne se transmet pas biologiquement à sa descendance.'
    }),
    queen: makeProfile('queen', 'FILM_CORE', { stage: 'adult', needsOvipositorToLay: true }),
    royal_facehugger: makeProfile('royal_facehugger', 'EXPANDED_COMPATIBLE', {
      stage: 'parasite', needsOrganicHost: true,
      note: 'La variante royale ne garantit pas une double implantation Reine–Prétorien.'
    }),
    spitter: makeProfile('spitter', 'EXPANDED_COMPATIBLE', { stage: 'adult', acidSpit: true }),
    worker: makeProfile('worker', 'EXPANDED_COMPATIBLE', { stage: 'adult' }),
    prowler: makeProfile('prowler', 'EXPANDED_COMPATIBLE', { stage: 'adult' }),
    burster: makeProfile('burster', 'EXPANDED_COMPATIBLE', { stage: 'adult', acidRupture: true }),
    boiler: makeProfile('boiler', 'EXPANDED_COMPATIBLE', { stage: 'adult', acidRupture: true }),
    crusher: makeProfile('crusher', 'EXPANDED_COMPATIBLE', { stage: 'adult' }),
    praetorian: makeProfile('praetorian', 'EXPANDED_COMPATIBLE', { stage: 'adult' }),
    palatine: makeProfile('palatine', 'EXPANDED_COMPATIBLE', { stage: 'adult' })
  };
  // These recognizable shapes have exceptional origins, not a standard hive cycle.
  ['offspring', 'newborn', 'deacon', 'neomorph'].forEach((id) => {
    profiles[id] = makeProfile(id, 'FILM_CORE', {
      stage: 'adult', naturalHiveCaste: false, acidBlood: false,
      referenceLabel: 'Apparence filmique ; origine exceptionnelle',
      note: 'La reproduction par la nurserie ordinaire et les statistiques sont des adaptations du jeu.'
    });
  });
  ['predalien', 'alpha', 'carrier', 'raven', 'king', 'deaconess', 'red_drone',
    'flying_drone', 'snake_drone', 'mantis_drone', 'bull_drone', 'gorilla_drone',
    'boar_drone', 'scorpion_drone', 'cougar_drone'].forEach((id) => {
    profiles[id] = makeProfile(id, 'EXPANDED_COMPATIBLE', { stage: 'adult', naturalHiveCaste: false });
  });
  const aliases = freeze({ egg: 'ovomorphe', worker_drone: 'worker', queenburster: 'chestburster' });
  freeze(profiles);

  function getFilmProfile(caste) {
    const id = aliases[keyOf(caste)] || keyOf(caste);
    return profiles[id] || freeze(makeProfile(id || 'unknown', 'INSPIRED_ORIGINAL', {
      stage: 'unknown', acidBlood: false, naturalHiveCaste: false,
      note: 'Aucune référence filmique vérifiée pour cette appellation.'
    }));
  }

  const syntheticTypes = new Set(['android', 'synthetic', 'weyland_steel_team_synth',
    'steelteam', 'steelteamsynth', 'steelteamandroid']);
  const mechanicalTypes = new Set(['powerloader', 'exosuit', 'turret', 'security_drone',
    'sentry', 'weyland_cyber_hound', 'cyberhound', 'cyber_hound']);
  const smallFaunaTypes = new Set(['labrodent', 'rodent', 'mouse', 'rat']);
  const quadrupedTypes = new Set(['labhound', 'dog', 'hound', 'ox', 'service_animal']);
  const protectedTypes = new Set(['commando', 'uscm_hazmat_tech', 'weyland_containment_squad', 'capture_commando']);
  const armoredTypes = new Set(['commando', 'smartgunner', 'gyro', 'marine']);

  function classifyHost(host) {
    const entity = typeof host === 'string' ? { type: host } : (host || {});
    const type = keyOf(entity.type || entity.hostType);
    const unavailable = !host || !type || entity.usedAsHost || entity.isConsumedByCycle ||
      entity.isInfected || entity.isDestroyed || entity.isEscaped ||
      (Number.isFinite(entity.hp) && entity.hp <= 0) ||
      (Number.isFinite(entity.health) && entity.health <= 0);
    let kind = 'organic';
    let reason = '';
    if (syntheticTypes.has(type) || /(^|_)(synthetic|android|synth)($|_)/.test(type)) {
      kind = 'synthetic';
      reason = 'Un synthétique ne peut pas incuber un embryon.';
    } else if (mechanicalTypes.has(type)) {
      kind = 'mechanical';
      reason = 'Une machine ne fournit aucun hôte organique viable.';
    } else if (smallFaunaTypes.has(type)) {
      kind = 'small_fauna';
      reason = 'Cet organisme est trop petit pour le cycle représenté dans cette campagne.';
    }
    const hasProtection = entity.hostEligibility === 'protected' || entity.maskAttachments > 0 ||
      (entity.hostEligibility !== 'viable' && protectedTypes.has(type));
    let eligibility = kind === 'organic' ? (hasProtection ? 'protected' : 'viable') : 'none';
    if (unavailable || entity.hostEligibility === 'none') {
      eligibility = 'none';
      if (!reason) reason = 'Cet hôte n’est plus disponible pour un nouveau cycle.';
    } else if (hasProtection && kind === 'organic') {
      reason = 'Le visage reste protégé : retirer les attaches du masque avant l’implantation.';
    }
    return freeze({
      type, kind, organic: kind === 'organic' || kind === 'small_fauna', eligibility,
      implantable: eligibility === 'viable',
      protectionAttachmentsRequired: eligibility === 'protected' ? Math.max(1, Number(entity.maskAttachments) || 2) : 0,
      morphology: quadrupedTypes.has(type) ? 'quadruped' : 'human', reason
    });
  }

  function canImplant(host) {
    return classifyHost(host).implantable;
  }

  function resolveHostOutcome(host) {
    const classification = classifyHost(host);
    if (!classification.implantable) return null;
    const adultCaste = classification.morphology === 'quadruped' ? 'runner' :
      (armoredTypes.has(classification.type) ? 'warrior' : 'drone');
    return freeze({
      adultCaste, morphology: classification.morphology,
      loreStatus: adultCaste === 'warrior' ? 'INSPIRED_ORIGINAL' : 'FILM_CORE',
      note: adultCaste === 'warrior'
        ? 'L’orientation Warrior est une spécialisation de jeu ; l’armure de l’hôte n’est pas héritée.'
        : 'La morphologie de l’hôte influence la posture ; les délais et statistiques sont adaptés au jeu.'
    });
  }

  function getAbilityPolicy(caste, action) {
    const profile = getFilmProfile(caste);
    const actionId = keyOf(action);
    let allowed = true;
    let reason = '';
    if (['acid', 'spit', 'acid_spit', 'acidspit'].includes(actionId)) {
      allowed = profile.acidSpit;
      if (!allowed) reason = 'Le crachat acide est réservé au Spitter. Le sang acide reste une réaction aux blessures.';
    } else if (['acid_blood', 'acidblood'].includes(actionId)) {
      allowed = profile.acidBlood;
      if (!allowed) reason = 'La corrosivité du sang de cette variante n’est pas établie ici.';
    } else if (['acid_burst', 'acid_cataclysm', 'acid_rupture'].includes(actionId)) {
      allowed = profile.acidRupture === true;
      if (!allowed) reason = 'Cette rupture corrosive appartient aux spécialisations Burster et Boiler.';
    } else if (actionId === 'lay_egg') {
      allowed = profile.needsOvipositorToLay === true;
      if (!allowed) reason = 'La ponte appartient à la Reine reliée à un ovipositeur fonctionnel.';
    }
    return freeze({
      allowed, action: actionId, caste: profile.id, reason, loreStatus: profile.loreStatus,
      requiresLineOfSight: !['acid_blood', 'acidblood', 'lay_egg'].includes(actionId),
      maxRange: ['acid', 'spit', 'acid_spit', 'acidspit'].includes(actionId) && allowed ? 22 : null
    });
  }

  function evaluateEggStimulus(input = {}) {
    const distance = Number.isFinite(input.distance) ? Math.max(0, input.distance) : Infinity;
    const radius = Number.isFinite(input.radius) ? Math.max(0, input.radius) : 4.5;
    const host = classifyHost(input.host);
    const warmth = Number.isFinite(input.heat) ? input.heat > 0 : input.heat === true;
    const vibration = Number.isFinite(input.vibration) ? input.vibration > 0 : input.vibration === true;
    const responsive = host.kind === 'organic' && host.eligibility !== 'none';
    const canSense = responsive && distance <= radius && (warmth || vibration);
    // A shell can register a nearby step without granting the leap through a wall.
    const canOpen = canSense && input.hasLineOfSight === true;
    // A covered face can be attacked to remove the mask; implantation is a separate guard.
    return freeze({ canSense, canOpen, canLaunch: canOpen, radius,
      reason: canOpen ? '' : 'Chaleur ou vibration d’un organisme proche et accès dégagé nécessaires.' });
  }

  function canLayEggs(queen) {
    return Boolean(queen && !queen.isDestroyed && queen.attachedToOvipositor === true &&
      queen.ovipositorSevered !== true && queen.ovipositorFunctional !== false &&
      (!Number.isFinite(queen.hp) || queen.hp > 0) &&
      (!Number.isFinite(queen.health) || queen.health > 0));
  }

  const root = typeof window !== 'undefined' ? window : globalThis;
  root.HiveFidelityRules = freeze({ getFilmProfile, classifyHost, canImplant,
    resolveHostOutcome, getAbilityPolicy, evaluateEggStimulus, canLayEggs });
})();
