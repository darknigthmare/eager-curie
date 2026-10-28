/* One catalog drives the nearby prompt, touch button and Space interaction.
 * Data preserves all 151 legacy device families (the last family has ten variants).
 * Effects still run through their real StationMap methods, not duplicated UI code.
 */
(function exposeContextualInteractions(global) {
  'use strict';
  const definitions=[
    {collection:"nitrogenTanks",method:"shatterNitrogenTank",range:5.5,ready:p=>!p.isRuptured,args:[],label:"Cuves Cryogéniques LN2"},
    {collection:"foundryCrucibles",method:"tiltFoundryCrucible",range:6.5,ready:p=>!p.isTilted,args:[],label:"Creuset de fonderie d'acier en fusion"},
    {collection:"freightElevators",method:"snapElevatorCables",range:5.5,ready:p=>(!p.cablesCut) && (!p.isCablesSnapped),args:[],label:"Monte-charge / câbles de levage"},
    {collection:"deconAirlocks",method:"triggerDecontaminationAirlock",range:5.5,ready:p=>!p.isFlushing,args:[],label:"Sas de décontamination caustique"},
    {collection:"industrialCranes",method:"operateCraneArm",range:6.5,ready:p=>!p.isCrushing,args:[],label:"Grue industrielle suspendue Seegson"},
    {collection:"fusionReactors",method:"overloadFusionReactorCore",range:6.5,ready:p=>!p.isOverloaded,args:[],label:"Cœur de réacteur à fusion surchauffé"},
    {collection:"muthurTerminals",method:"interactMuthurTerminal",range:4.5,ready:p=>(!p.cooldown || p.cooldown <= 0),args:[],label:"Terminal rétro M.U.T.H.U.R. 6000"},
    {collection:"highPressureSteamValves",method:"ruptureHighPressureSteamValve",range:5.5,ready:p=>!p.isRuptured,args:[],label:"Vanne Hydraulique de Vapeur 40 Bars"},
    {collection:"titaniumBarricades",method:"damageTitaniumBarricade",range:5.5,ready:p=>!p.isDestroyed,args:[60],label:"Barricade en Titane USCM"},
    {collection:"seegsonMedibots",method:"sabotageSeegsonMedibot",range:5.5,ready:p=>!p.isSabotaged,args:[],label:"Robot Médical Seegson Medi-Bot"},
    {collection:"hangingHVCables",method:"severHangingHVCables",range:5.5,ready:p=>!p.isSevered,args:[],label:"Câbles Haute Tension 50 000 V"},
    {collection:"zeroGGenerators",method:"triggerZeroGGeneratorFlush",range:6.5,ready:p=>(!p.activeTimer || p.activeTimer <= 0),args:[],label:"Générateur Gyroscopique Zero-G"},
    {collection:"cryoStasisPods",method:"shatterCryoStasisPod",range:5.5,ready:p=>!p.isShattered,args:[],label:"Caisson d'Hyper-Sommeil Cryogénique"},
    {collection:"hivePheromoneSpores",method:"triggerHivePheromoneSpore",range:5.5,ready:p=>(!p.isTriggered) && (!(p.activeTimer > 0)),args:[],label:"Spore Phéromonale de Ruche"},
    {collection:"barbedWireSpools",method:"cutBarbedWireSpool",range:5.5,ready:p=>!p.isCut,args:[60],label:"Bobine de Fil Barbelé Concertina Électrifié"},
    {collection:"flightRecorders",method:"readFlightRecorder",range:5.5,ready:p=>(!p.isPlayed) && (!p.isRead),args:[],label:"Enregistreur de Vol Blindé M7 Black Box"},
    {collection:"auxiliaryGenerators",method:"sabotageAuxiliaryGenerator",range:5.5,ready:p=>!p.isSabotaged,args:[],label:"Panneau de Générateur Auxiliaire de Secours"},
    {collection:"laserDesignators",method:"destroyLaserDesignator",range:5.5,ready:p=>(!p.isDestroyed) && (p.isActive !== false),args:[60],label:"Tourelle de Désignation Laser Tactique"},
    {collection:"orbitalDockingClamps",method:"ejectOrbitalDockingClamp",range:5.5,ready:p=>!p.isEjected,args:[],label:"Verrou de Serrage d'Amarrage Orbital"},
    {collection:"forklifts",method:"ruptureForkliftBattery",range:5.5,ready:p=>!p.isRuptured,args:[],label:"Chariot Élévateur Industriel Lithium"},
    {collection:"ceilingSprinklers",method:"triggerFireSprinklers",range:5.5,ready:p=>!p.isSpraying,args:[],label:"Buse Incendie Automatique Halon/Eau"},
    {collection:"toxicWasteChutes",method:"activateToxicWasteChute",range:5.5,ready:p=>!p.isActive,args:[],label:"Trémie de Décharge Déchets Toxiques"},
    {collection:"portableMortars",method:"destroyPortableMortar",range:5.5,ready:p=>!p.isDestroyed,args:[60],label:"Tourelle Mortier M40 USCM Shrapnel"},
    {collection:"narcissusDocks",method:"sabotageNarcissusDock",range:5.5,ready:p=>!p.isSealed,args:[],label:"Sas d'Amarrage Navette de Sauvetage Narcissus"},
    {collection:"m577APCs",method:"sabotageM577APC",range:5.5,ready:p=>!p.isSabotaged,args:[],label:"Transport Blindé M577 APC USCM"},
    {collection:"waterDropletVents",method:"triggerWaterDropletVent",range:4.5,ready:p=>true,args:[],label:"Sas de Condensation d'Eau"},
    {collection:"wallDefibrillators",method:"dischargeWallDefibrillator",range:4.5,ready:p=>!p.isOverloaded,args:[],label:"Défibrillateur Médical Seegson 5000V"},
    {collection:"reactionPurgeVents",method:"triggerReactionPurgeVent",range:5.5,ready:p=>!p.isFlushing,args:[],label:"Tuyère SAS C-30 Poussée Réactionnelle"},
    {collection:"thermalSurveillancePosts",method:"destroyThermalSurveillancePost",range:4.5,ready:p=>!p.isDestroyed,args:[60],label:"Poste Surveillance Thermique USCM"},
    {collection:"reactorDisconnectConsoles",method:"triggerReactorEvacuationCountdown",range:4.5,ready:p=>!p.isEvacuating,args:[],label:"Console Déconnexion Réacteur Principal & Évacuation"},
    {collection:"subzeroCoolantPanels",method:"ruptureSubZeroCoolant",range:4.5,ready:p=>!p.isRuptured,args:[],label:"Panneau Réfrigération Cryogénique Sub-Zero Coolant"},
    {collection:"m42aSniperPosts",method:"destroyM42ASniperPost",range:4.5,ready:p=>!p.isDestroyed,args:[120],label:"Affût Sniper Smart-Scoped M42A USCM"},
    {collection:"underfloorGrates",method:"executeUnderfloorGrateAmbush",range:3.8,ready:p=>true,args:[],label:"Trappe de Plancher Caillebotis Pop-Up"},
    {collection:"bulkheadShutterConsoles",method:"toggleBulkheadShutters",range:4.5,ready:p=>true,args:[],label:"Console Volets Anti-Souffle Confinement"},
    {collection:"syntheticChargingBays",method:"sabotageChargingBay",range:4.5,ready:p=>!p.isOverloaded,args:[],label:"Module Recharge Synthétiques Seegson"},
    {collection:"holographicDecoyProjectors",method:"destroyHolographicDecoy",range:4.5,ready:p=>!p.isDestroyed,args:[80],label:"Projecteur Holographique Tactique USCM"},
    {collection:"atmosphericDepressionConsoles",method:"triggerAtmosphericDepression",range:4.5,ready:p=>!p.isDepressed,args:[],label:"Console Purge Atmosphérique N2/O2 M.U.T.H.U.R."},
    {collection:"sadarLaunchers",method:"fireSadarRocket",range:4.5,ready:p=>!p.isFired && !p.isDestroyed,args:[],label:"Affût Lance-Roquettes M83A2 SADAR USCM"},
    {collection:"hydraulicOilPipes",method:"ruptureHydraulicOilPipe",range:4.5,ready:p=>!p.isRuptured,args:[],label:"Réseau de Canalisations d'Huile Hydraulique"},
    {collection:"laserDeconArches",method:"sabotageLaserDeconArch",range:4.5,ready:p=>!p.isSabotaged,args:[],label:"SAS Quarantaine Médicale Laser UV"},
    {collection:"magneticCraneContainers",method:"releaseMagneticCrane",range:4.5,ready:p=>!p.isDropped,args:[],label:"Grue Magnétique & Conteneur 10T"},
    {collection:"zx76ShotgunRacks",method:"lootZX76ShotgunRack",range:4.5,ready:p=>!p.isLooted,args:[],label:"Râtelier Fusils à Pompe ZX-76"},
    {collection:"halonGasGenerators",method:"triggerHalonGasSuppression",range:4.5,ready:p=>!p.isSuppressed,args:[],label:"Générateur Brouillard Halon"},
    {collection:"surveillanceRadioConsoles",method:"interceptMarinesRadio",range:4.5,ready:p=>!p.isIntercepting,args:[],label:"Terminal Surveillance Weyland & Radio USCM"},
    {collection:"co2Extinguishers",method:"dischargeCO2Extinguisher",range:4.5,ready:p=>!p.isDischarged,args:[],label:"Extincteur Portatif CO2 Seegson"},
    {collection:"biowasteIncinerators",method:"activateBioWasteIncinerator",range:5.5,ready:p=>!p.isActive,args:[],label:"Incinérateur Central 1200°C Fiorina 161"},
    {collection:"evaRoboticArms",method:"operateEvaRoboticArm",range:5.5,ready:p=>(!p.isOperating) && (!p.isOperated),args:[],label:"Bras Manipulateur Industriel EVA"},
    {collection:"laserClaymoreMines",method:"triggerLaserClaymore",range:4.5,ready:p=>(!p.isTriggered) && (!p.isDetonated),args:[],label:"Mine Claymore Laser M18A3 USCM"},
    {collection:"freonFogGenerators",method:"releaseFreonFog",range:5.5,ready:p=>(!p.isActive) && (!p.isLeaking),args:[],label:"Générateur Fréon Glacial Sub-Zero"},
    {collection:"muthurBioScanConsoles",method:"consultMuthurBioScan",range:4.5,ready:p=>(!p.isAnalyzed) && (!p.isConsulted),args:[],label:"Console Bio-Scan MUTHUR 6000"},
    {collection:"waterCurtains",method:"triggerWaterCurtain",range:5.5,ready:p=>!p.isFlushing,args:[],label:"Rideau d'Eau Industriel Haute Pression"},
    {collection:"bulkheadControlPanels",method:"operateBulkheadControlPanel",range:5.5,ready:p=>!p.isSealed,args:[],label:"Poste de Contrôle des SAS Étanches d'Urgence Weyland"},
    {collection:"geothermalTurbines",method:"releaseGeothermalSteam",range:5.5,ready:p=>!p.isBlasting,args:[],label:"Générateur d'Énergie Thermique & Soupape Fiorina 161"},
    {collection:"m24ElectricWireTurrets",method:"triggerM24ElectricWire",range:4.5,ready:p=>!p.isDestroyed,args:[],label:"Tourelle de Barbelés Micro-Électrifiés M24 USCM"},
    {collection:"subZeroCryoGelCanisters",method:"dischargeCryoGelCanister",range:4.5,ready:p=>!p.isDischarged,args:[],label:"Réservoir Pressurisé de Gel Cryogénique Sub-Zero LN2"},
    {collection:"seegsonDiagnosticAlcoves",method:"operateSeegsonDiagnosticAlcove",range:4.5,ready:p=>(true) && (!p.isOverloaded),args:[],label:"Console de Diagnostic Synthétique Seegson & Alcôve Working Joe"},
    {collection:"acousticJammers",method:"operateAcousticJammer",range:4.5,ready:p=>!p.isDestroyed,args:[],label:"Système de Brouilleur Acoustique Ultrasonique USCM M20"},
    {collection:"cryoSterilizers",method:"dischargeCryoSterilizer",range:5,ready:p=>!p.isDischarged,args:[],label:"Unité Autonome de Décontamination Cryo-Stérilisante"},
    {collection:"eevConsoles",method:"operateEevConsole",range:4.5,ready:p=>!p.isEjected,args:[],label:"Poste de Contrôle des SAS d'Éjection de Capsule EEV Type 37"},
    {collection:"napalmTraps",method:"triggerM20BNapalm",range:4,ready:p=>!p.isDetonated,args:[],label:"Mine Antipersonnel Incendiaire M20B Napalm Trap"},
    {collection:"ammoniaPipes",method:"ruptureAmmoniaPipe",range:4.5,ready:p=>!p.isRuptured,args:[],label:"Canalisations d'Ammoniac Industriel 60 Bars"},
    {collection:"bioCoreInterfaces",method:"harvestBioCoreJelly",range:4.5,ready:p=>!p.isHarvested,args:[],label:"Terminal Bio-Core Nursery & Synthèse de Gelée Royale"},
    {collection:"m94SmokeSystems",method:"operateM94SmokeSystem",range:4.5,ready:p=>(!p.isTriggered) && (!p.isActive),args:[],label:"Système M94 Smoke Screen Aérosol USCM"},
    {collection:"cryoPurgeStations",method:"triggerCryoPurgeC44",range:4.5,ready:p=>!p.isPurging,args:[],label:"Station de Purge Cryogénique Rapide C-44 Fiorina"},
    {collection:"fusionStations",method:"sabotageFusionStation",range:4.5,ready:p=>!p.isSabotaged,args:[],label:"Station de Rechargement de Batteries à Fusion Seegson"},
    {collection:"hydraulicSpurtManifolds",method:"ruptureHydraulicManifold",range:4.5,ready:p=>!p.isRuptured,args:[],label:"Collecteur Hydraulique à Haute Pression Sous-Pression"},
    {collection:"muthurTelemetryConsoles",method:"consultMuthurTelemetry",range:4.5,ready:p=>(!p.isAnalyzed) && (!p.isScanning),args:[],label:"Console de Télémétrie et Surveillance Weyland-Yutani M.U.T.H.U.R. 6000"},
    {collection:"ovipositorCradles",method:"communeWithOvipositorCradle",range:4.5,ready:p=>!p.isCommuned,args:[],label:"Berceau d'Oviposition et de Gestation Reine Biomécanique"},
    {collection:"m47IRSmokeDispensers",method:"operateM47IRSmokeDispenser",range:5.5,ready:p=>!p.isTriggered,args:[],label:"Diffuseur d'Aérosol Fumigène Infrarouge M47 USCM"},
    {collection:"cryoFlowStations",method:"triggerCryoFlowC50",range:5.5,ready:p=>(!p.isSpraying) && (!p.isPurging),args:[],label:"Poste de Dispersion Cryogénique Hyperbare Cryo-Flow C-50"},
    {collection:"hyperdyneTokamaks",method:"sabotageHyperdyneTokamak",range:5.5,ready:p=>!p.isSabotaged,args:[],label:"Purgeur de Fuite Tokamak Hyperdyne Dynamics"},
    {collection:"argonManifoldPipes",method:"ruptureArgonPipe",range:5.5,ready:p=>!p.isRuptured,args:[],label:"Canalisation Haute Pression Gaz Neutre Argon"},
    {collection:"muthurScrubberConsoles",method:"operateMuthurScrubber",range:5.5,ready:p=>(!p.isOperating) && (!p.isOverridden),args:[],label:"Pupitre d'Épuration Atmosphérique et Dépressurisation Sélective MUTHUR 6000"},
    {collection:"biomassSarcophagi",method:"convertBiomassSarcophagus",range:5.5,ready:p=>!p.isConverted,args:[],label:"Sarcophage de Stase et Conversion de Biomasse Ingénieur"},
    {collection:"m56JammerBoxes",method:"operateM56JammerBox",range:5.5,ready:p=>!p.isTriggered,args:[],label:"Système de Brouilleur Électromagnétique Portatif USCM M56"},
    {collection:"cryoChamberC60s",method:"triggerCryoChamberC60",range:5.5,ready:p=>!p.isTriggered,args:[],label:"Poste de Contrôle Cryo-Containment Chamber C-60"},
    {collection:"arcFurnaceInverters",method:"sabotageArcFurnaceInverter",range:5.5,ready:p=>!p.isSabotaged,args:[],label:"Générateur Magnétique Weyland Arc-Furnace Inverter"},
    {collection:"ethyleneFlarePipes",method:"ruptureEthyleneFlarePipe",range:5.5,ready:p=>!p.isRuptured,args:[],label:"Collecteur d'Éthylène Haute Température & Torche Industrielle"},
    {collection:"seegsonCasaiOverrides",method:"operateSeegsonCasaiOverride",range:5.5,ready:p=>!p.isOverridden,args:[],label:"Terminal Réseau C.A.S.A.I. Seegson Synthetic Security Override"},
    {collection:"bioStasisVaults",method:"consumeBioStasisVault",range:5.5,ready:p=>!p.isConsumed,args:[],label:"Couveuse Biologique Bio-Stasis Pathogène Noir A0-3959X"},
    {collection:"transitMagCarts",method:"launchTransitMagCart",range:5.5,ready:p=>!p.isPropelled,args:[],label:"Wagonnet de Transit Mag-Lev AP-14"},
    {collection:"halonExtinguishers",method:"triggerHalonExtinguisher",range:5.5,ready:p=>!p.isDischarged,args:[],label:"Diffuseur Automatique Gaz Halon 1301"},
    {collection:"m20ClaymoreMines",method:"detonateM20ClaymoreMine",range:5.5,ready:p=>p.isArmed && !p.isDetonated,args:[],label:"Mine Directionnelle USCM M20 Claymore"},
    {collection:"heatExchangerVents",method:"ruptureHeatExchangerVent",range:5.5,ready:p=>!p.isRuptured,args:[],label:"Échangeur Thermique Primaire AP-14"},
    {collection:"resinCamouflageWalls",method:"interactResinCamouflageWall",range:5.5,ready:p=>p.isActive,args:[],label:"Niche Organique Camouflage Résine"},
    {collection:"maintenanceJackSockets",method:"toggleMaintenanceJackSocket",range:5.5,ready:p=>true,args:[],label:"Boîtier Sevastopol Maintenance Jack Socket"},
    {collection:"workingJoeAlcoves",method:"sabotageWorkingJoeAlcove",range:5.5,ready:p=>!p.isSabotaged,args:[],label:"Alcôve de Charge 15kV Working Joe Apollo"},
    {collection:"biocontainmentVaults",method:"triggerBiocontainmentDecon",range:5.5,ready:p=>!p.isCycling,args:[],label:"Chambre d'Isolation Spécimen Alpha Weyland-Yutani"},
    {collection:"nostromoReactorRings",method:"sabotageReactorRing",range:5.5,ready:p=>!p.isSabotaged,args:[],label:"Anneau Toroïdal Réacteur Classe M Nostromo"},
    {collection:"geothermalVentFlues",method:"triggerGeothermalVentFlue",range:5.5,ready:p=>!p.isVenting,args:[],label:"Cheminée d'Évacuation Géothermique Sevastopol"},
    {collection:"jettisonConsoles",method:"triggerJettisonExplosiveBolts",range:5.5,ready:p=>!p.isArming && !p.isJettisoned,args:[],label:"Pupitre d'Éjection Pyrotechnique Weyland-Yutani"},
    {collection:"fiorinaLeadChannels",method:"breachFiorinaLeadSluice",range:5.5,ready:p=>!p.isBreached,args:[],label:"Rigole de Coulée de Plomb Fiorina 161"},
    {collection:"maintenanceGondolas",method:"dropMaintenanceGondola",range:6,ready:p=>!p.isDropped,args:[],label:"Nacelle d'Entretien Suspendue Sevastopol"},
    {collection:"syntheticCells",method:"sealSyntheticCell",range:5.5,ready:p=>!p.isSealed,args:[],label:"Cellule d'Isolement Synthétique Weyland-Yutani"},
    {collection:"ventilationShaftFans",method:"sabotageVentilationFan",range:5.5,ready:p=>(!p.isSabotaged) && (!p.isReversed),args:[],label:"Rotor de Puits de Ventilation Primaire Renaissance"},
    {collection:"atmosphericScrubbers",method:"punctureAtmosphericScrubber",range:5.5,ready:p=>(!p.isPunctured) && (!p.isRuptured),args:[],label:"Colonne d'Épuration Atmosphérique Sevastopol"},
    {collection:"gravityInversionChambers",method:"triggerGravityInversion",range:6.5,ready:p=>(!p.isCycling) && (!p.isZeroG),args:[],label:"Chambre d'Inversion Gravitationnelle Fiorina 161"},
    {collection:"uscmSentryBarricades",method:"breachSentryBarricade",range:5.5,ready:p=>!p.isBreached,args:[],label:"Barricade Déployable USCM Hadley's Hope"},
    {collection:"apolloServerTowers",method:"corruptApolloServerTower",range:5.5,ready:p=>!p.isCorrupted,args:[],label:"Baie Serveurs Apollo AI Sevastopol"},
    {collection:"dissectionTheaters",method:"strapVictimToDissectionTable",range:5.5,ready:p=>!p.isStrapped,args:[],label:"Théâtre de Dissection Weyland USM Auriga"},
    {collection:"cryoVaultMatrices",method:"shatterCryoManifold",range:5.5,ready:p=>!p.isShattered,args:[],label:"Matrice Cryogénique Nostromo"},
    {collection:"chasmBridges",method:"retractChasmBridge",range:6,ready:p=>true,args:[],label:"Passerelle Rétractable Operations Chasm"},
    {collection:"toxicQuenchBasins",method:"overflowQuenchBasin",range:5.5,ready:p=>!p.isOverflowing,args:[],label:"Bassin de Trempe Toxique Fiorina 161"},
    {collection:"observationLabWindows",method:"shatterObservationWindow",range:5.5,ready:p=>!p.isShattered,args:[],label:"Baie Vitrée sans Tain Laboratoire Auriga"},
    {collection:"cryoFuelCentrifuges",method:"overloadCryoCentrifuge",range:5.5,ready:p=>!p.isOverloaded,args:[],label:"Centrifugeuse Cryogénique Renaissance"},
    {collection:"transitRailSwitches",method:"shortCircuitThirdRail",range:5.5,ready:p=>!p.isDischarged,args:[],label:"Aiguillage Ferroviaire & 3e Rail Sevastopol"},
    {collection:"medlabAutopsyChutes",method:"dumpCorpseIntoIncinerator",range:5.5,ready:p=>true,args:[],label:"Goulotte Incinérateur MedLab Hadley"},
    {collection:"vehicleCraneArms",method:"swingVehicleCrane",range:6,ready:p=>!p.isSwinging,args:[],label:"Bras de Grue d'Atelier APC M577 USCM"},
    {collection:"lorenzCommsDishes",method:"jamLorenzCommsUplink",range:5.5,ready:p=>!p.isJammed,args:[],label:"Parabole d'Interception Lorenz Systech"},
    {collection:"corbelDockingClamps",method:"releaseDockingClamp",range:6,ready:p=>!p.isReleased,args:[],label:"Mors d'Amarrage Sas Corbel"},
    {collection:"narcissusBoardingRamps",method:"extendNarcissusRamp",range:6.5,ready:p=>true,args:[],label:"Rampe d'Accès Navette Narcissus"},
    {collection:"seismicPistons",method:"triggerSeismicStabilizer",range:6,ready:p=>!p.isPumping,args:[],label:"Piston Stabilisateur Sismique Hadley"},
    {collection:"furnaceBellowsDucts",method:"purgeFurnaceBellows",range:6,ready:p=>!p.isPurging,args:[],label:"Soufflet Haut Fourneau Fiorina"},
    {collection:"cryoSurgicalSarcophagi",method:"unsealCryoSarcophagus",range:6,ready:p=>!p.isUnsealed,args:[],label:"Sarcophage Stasique Cryo-Chirurgical Auriga"},
    {collection:"fuelSiphonPylons",method:"overpressureFuelSiphon",range:6,ready:p=>!p.isVenting,args:[],label:"Pylône de Siphonnage Propergol Renaissance"},
    {collection:"securityShutterDoors",method:"toggleSecurityShutter",range:6,ready:p=>true,args:[],label:"Rideau Roulant de Sécurité Sevastopol"},
    {collection:"processingSumpSiphons",method:"flushProcessingSump",range:6,ready:p=>!p.isFlushing,args:[],label:"Siphon Puisard Traitement Hadley"},
    {collection:"munitionsHeavyPallets",method:"detonateMunitionsPallet",range:6,ready:p=>!p.isDetonated,args:[],label:"Palette Munitions Lourdes USCM"},
    {collection:"syntheticRechargeBays",method:"overloadSyntheticBay",range:6,ready:p=>!p.isOverloaded,args:[],label:"Alcôve Recharge Synthétiques Sevastopol"},
    {collection:"foundryGantryHoists",method:"dropFoundryGantryLadle",range:6,ready:p=>!p.isDropped,args:[],label:"Treuil de Pont Roulant Fonderie Fiorina"},
    {collection:"nostromoCoolantHatches",method:"decompressCoolantHatch",range:6,ready:p=>!p.isDecompressed,args:[],label:"Sas Cryo Nostromo E-Deck"},
    {collection:"hadleyCoolantFlumes",method:"ruptureCoolantFlume",range:6,ready:p=>!p.isRuptured,args:[],label:"Flume Caloporteur Processeur Hadley"},
    {collection:"fiorinaCounterweightPistons",method:"releaseCounterweightPiston",range:6,ready:p=>!p.isDropped,args:[],label:"Piston Contrepoids Gaine Fiorina"},
    {collection:"aurigaBioreactorDomes",method:"destabilizeBioreactor",range:6,ready:p=>!p.isDestabilized,args:[],label:"Dôme Bioréacteur Séquençage Auriga"},
    {collection:"remusGantryRails",method:"traverseRemusGantry",range:6,ready:p=>true,args:[],label:"Rail Portique Fret Remus"},
    {collection:"seegsonTestBooths",method:"overloadSeegsonBooth",range:6,ready:p=>!p.isGlitched,args:[],label:"Cabine Test Synthétiques Seegson"},
    {collection:"medlabIncubatorRacks",method:"shatterIncubatorRack",range:6,ready:p=>!p.isShattered,args:[],label:"Batterie Racks Couveuses MedLab"},
    {collection:"uscmSandbagBunkers",method:"breachSandbagBunker",range:6,ready:p=>!p.isBreached,args:[],label:"Bunker Sacs de Sable USCM"},
    {collection:"habitationLouverShutters",method:"cycleLouverShutter",range:6,ready:p=>true,args:[],label:"Persiennes Circulation Air Sevastopol"},
    {collection:"quenchOverflowWeirs",method:"openQuenchWeir",range:6,ready:p=>!p.isOpen,args:[],label:"Déversoir Trop-Plein Fosse Trempe Fiorina"},
    {collection:"coolingBlowers",method:"overdriveCoolingBlower",range:6,ready:p=>!p.isOverdriven,args:[],label:"Soufflerie Cryogénique Nostromo"},
    {collection:"tacticalHoloTables",method:"hackTacticalTable",range:6,ready:p=>!p.isHacked,args:[],label:"Table Tactique Holographique Hadley"},
    {collection:"leadDrainageSluices",method:"releaseLeadSluice",range:6,ready:p=>!p.isOpen,args:[],label:"Rigole Coulée Plomb Fiorina"},
    {collection:"specimenHoldingCages",method:"shortCircuitHoldingCage",range:6,ready:p=>!p.isShocking,args:[],label:"Cage Spécimen Xénomorphe Auriga"},
    {collection:"stasisCarousels",method:"spinStasisCarousel",range:6,ready:p=>true,args:[],label:"Carrousel Stase Cryo Romulus"},
    {collection:"monorailBufferStops",method:"compressMonorailBuffer",range:6,ready:p=>!p.isCompressed,args:[],label:"Butoir Hydraulique Monorail Sevastopol"},
    {collection:"steamSuperheaters",method:"ventSuperheaterSteam",range:6,ready:p=>!p.isVenting,args:[],label:"Surchauffeur Vapeur Processeur Hadley"},
    {collection:"uscmWeaponRacks",method:"unlockUscmWeaponRack",range:6,ready:p=>!p.isUnlocked,args:[],label:"Râtelier d'Armes Lourdes USCM"},
    {collection:"syntheticAssemblyStations",method:"overloadAssemblyStation",range:6,ready:p=>!p.isOverloaded,args:[],label:"Banc Assemblage Synthétiques Seegson"},
    {collection:"furnaceAirIntakes",method:"purgeFurnaceAirIntake",range:6,ready:p=>!p.isPurged,args:[],label:"Prise d'Air Venturi Fonderie Fiorina"},
    {collection:"overheadMonorailHoists",method:"dropMonorailHoist",range:6,ready:p=>!p.isDropped,args:[],label:"Treuil de Pont Roulant Nostromo"},
    {collection:"emergencyBatteryBanks",method:"dischargeBatteryBank",range:6,ready:p=>!p.isDischarged,args:[],label:"Baie d'Accumulateurs de Secours Hadley"},
    {collection:"heavyQuenchBaskets",method:"lowerQuenchBasket",range:6,ready:p=>!p.isLowered,args:[],label:"Panier de Trempe à Scories Fiorina"},
    {collection:"surgicalCryoCentrifuges",method:"spinUpCryoCentrifuge",range:6,ready:p=>!p.isSpunUp,args:[],label:"Centrifugeuse Cryo-Chirurgicale Auriga"},
    {collection:"fuelTransferManifolds",method:"purgeFuelManifold",range:6,ready:p=>!p.isPurged,args:[],label:"Collecteur de Carburant Cryo Romulus"},
    {collection:"baggageInspectionScanners",method:"jamBaggageScanner",range:6,ready:p=>!p.isJammed,args:[],label:"Portique Scanner à Rayons X Sevastopol"},
    {collection:"steamTurbogenerators",method:"overdriveSteamTurbogenerator",range:6,ready:p=>!p.isOverdriven,args:[],label:"Turbogénérateur Géothermique Hadley"},
    {collection:"ballisticTestSleds",method:"fireBallisticSled",range:6,ready:p=>!p.isFired,args:[],label:"Stand de Tir & Chariot Balistique USCM"},
    {collection:"apolloCableTrays",method:"tapApolloCableTray",range:6,ready:p=>!p.isTapped,args:[],label:"Chemin de Câbles Faisceau Apollo Seegson"},
    {collection:"blastFurnaceTuyeres",method:"injectBlastTuyereOxygen",range:6,ready:p=>!p.isOxygenInjected,args:[],label:"Tuyère de Soufflage Haut Fourneau Fiorina"},
    {collection:"wave31Props",method:"triggerWave31Prop",range:6,ready:p=>!p.isTriggered,args:[],label:"Props Vague 31"},
  ].map(rule=>Object.freeze({...rule,args:Object.freeze(rule.args)}));
  Object.freeze(definitions);
  const byCollection=new Map(definitions.map(rule=>[rule.collection,rule]));
  const deviceButtons=Object.freeze([
    ['btn-underfloor-grate-ambush','underfloorGrates'],
    ['btn-intercept-radio','surveillanceRadioConsoles'],['btn-consult-bioscan','muthurBioScanConsoles'],
    ['btn-operate-bulkhead','bulkheadControlPanels'],['btn-operate-alcove','seegsonDiagnosticAlcoves'],
    ['btn-operate-eev','eevConsoles'],['btn-harvest-biocore','bioCoreInterfaces'],
    ['btn-consult-telemetry','muthurTelemetryConsoles'],['btn-cradle-commune','ovipositorCradles'],
    ['btn-operate-scrubber','muthurScrubberConsoles'],['btn-sarcophagus-convert','biomassSarcophagi'],
    ['btn-operate-casai','seegsonCasaiOverrides'],['btn-consume-biovault','bioStasisVaults'],
    ['btn-launch-magcart','transitMagCarts'],['btn-trigger-halon','halonExtinguishers']
  ].map(([id,collection])=>Object.freeze({id,collection})));
  const recovery=new WeakMap();
  const finitePoint=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const now=options=>Number.isFinite(options?.now)?options.now:Date.now();
  const actions={
    nitrogenTanks:'Libérer le nuage cryogénique',foundryCrucibles:'Déverser le métal en fusion',
    freightElevators:'Rompre les câbles du monte-charge',deconAirlocks:'Déclencher la douche caustique',
    highPressureSteamValves:'Libérer le jet de vapeur',flightRecorders:'Écouter le journal de bord',
    underfloorGrates:'Happer la proie au-dessus',waterDropletVents:'Masquer les pas pendant 10 s',
    hangingHVCables:'Abattre les câbles haute tension',industrialCranes:'Manœuvrer la pince industrielle',
    muthurTerminals:'Consulter et détourner la sécurité',medlabAutopsyChutes:'Éliminer la dépouille',
    dissectionTheaters:'Immobiliser la proie sur la table',emergencyBatteryBanks:'Décharger la batterie'
  };
  function actionFor(rule,prop) {
    if(actions[rule.collection])return actions[rule.collection];
    if(rule.collection==='wave31Props')return prop.label?'Déclencher : '+prop.label:'Déclencher le piège de zone';
    if(/^(read|consult|interact)/.test(rule.method))return 'Consulter les données';
    if(/^(harvest|consume|convert|commune|loot)/.test(rule.method))return 'Récupérer la ressource';
    if(/^(purge|flush|vent|inject)/.test(rule.method))return 'Purger le circuit';
    if(/^(overload|overdrive|discharge)/.test(rule.method))return 'Libérer la décharge';
    if(/^(shatter|rupture|puncture|cut|snap|sever)/.test(rule.method))return 'Rompre le circuit';
    if(/^(damage|destroy|sabotage|jam)/.test(rule.method))return 'Saboter le dispositif';
    if(/^(drop|lower|release|eject)/.test(rule.method))return 'Libérer la charge';
    if(/^(toggle|cycle|operate|traverse|extend|retract|spin)/.test(rule.method))return 'Manœuvrer le mécanisme';
    return 'Activer l’installation';
  }
  function onDeck(actor) {
    return finitePoint(actor)&&!actor.isDefeated&&!actor.isInVent&&!actor.isCeilingProwling&&
      !actor.isSubfloorProwling&&!actor.isLeaping&&!actor.isChrysalis&&!actor.attachedHost&&
      (!actor.form||actor.form==='drone')&&!(Number.isFinite(actor.health)&&actor.health<=0);
  }
  function hasSight(map,from,prop,aim=prop) {
    if(!finitePoint(from)||!finitePoint(prop)||!finitePoint(aim))return false;
    if(Array.isArray(map.colliders)&&typeof map.segmentIntersectsCollider==='function') {
      return !map.colliders.some(c=>{
        // A fitting is operated from outside its body. Its own collider may
        // contain its center, but must not shield a different prop or a wall.
        if(Object.values(c).some(value=>value===prop))return false;
        return map.segmentIntersectsCollider(from.x,from.z,aim.x,aim.z,c,.08);
      });
    }
    return !!map.hasLineOfSight?.(from.x,from.z,aim.x,aim.z,.08);
  }
  function hasRequiredSubject(rule,prop,options) {
    const humans=options.humans||[];
    if(rule.collection==='underfloorGrates')
      return humans.some(h=>finitePoint(h)&&!h.isIncapacitated&&!h.isCocooned&&!h.isConsumedByCycle&&h.hp>0&&distance(h,prop)<=3.8);
    if(rule.collection==='dissectionTheaters')
      return humans.some(h=>finitePoint(h)&&!h.isCocooned&&!h.isConsumedByCycle&&h.hp>0&&distance(h,prop)<=3.8);
    if(rule.collection==='medlabAutopsyChutes')
      return humans.some(h=>finitePoint(h)&&(h.isIncapacitated||h.isCocooned)&&!h.isConsumedByCycle&&h.mesh?.visible!==false&&distance(h,prop)<=4.5);
    return true;
  }
  function eligible(map,actor,rule,prop,options) {
    return finitePoint(prop)&&!prop.isDestroyed&&!(Number.isFinite(prop.hp)&&prop.hp<=0)&&
      typeof map[rule.method]==='function'&&rule.ready(prop)&&
      !(now(options)<(recovery.get(prop)||0))&&distance(actor,prop)<=rule.range&&
      hasRequiredSubject(rule,prop,options)&&hasSight(map,actor,prop);
  }
  function select(map,actor,options={}) {
    if(!map||options.active===false||!onDeck(actor))return null;
    let best=null;
    const rules=options.collections?options.collections.map(key=>byCollection.get(key)).filter(Boolean):definitions;
    for(const rule of rules)for(const [index,prop]of (map[rule.collection]||[]).entries()) {
      if(!eligible(map,actor,rule,prop,options))continue;
      const d=distance(actor,prop),id=rule.collection+':'+(prop.id||index);
      if(best&&(d>best.distance+1e-7||(Math.abs(d-best.distance)<=1e-7&&id>=best.id)))continue;
      best={rule,prop,distance:d,id,name:prop.name||rule.label,action:actionFor(rule,prop)};
    }
    return best;
  }
  function resolvePreferred(map,actor,preferred,options) {
    const prop=preferred?.prop||preferred;
    if(!prop)return select(map,actor,options);
    if(!map||options.active===false||!onDeck(actor))return null;
    const rules=options.collections?options.collections.map(key=>byCollection.get(key)).filter(Boolean):definitions;
    for(const rule of rules)if((map[rule.collection]||[]).includes(prop)&&eligible(map,actor,rule,prop,options))
      return {rule,prop,distance:distance(actor,prop),id:rule.collection+':'+(prop.id||(map[rule.collection]||[]).indexOf(prop)),
        name:prop.name||rule.label,action:actionFor(rule,prop)};
    return null;
  }
  function describe(candidate) {
    return candidate?candidate.action+' · '+candidate.name+' — '+candidate.distance.toFixed(1)+' m':'';
  }
  function execute(map,actor,preferred=null,options={}) {
    const candidate=resolvePreferred(map,actor,preferred,options);
    if(!candidate)return {handled:!!preferred,success:false,candidate:null,
      reason:preferred?'Interaction indisponible : rapprochez-vous du dispositif et dégagez son accès.':'Aucun dispositif utilisable à portée.'};
    // Reserve before effects, including re-entrant input listeners.
    const {rule,prop}=candidate;
    const previousRecovery=recovery.get(prop);
    recovery.set(prop,now(options)+(rule.collection==='underfloorGrates'||rule.collection==='dissectionTheaters'?1500:450));
    const result=map[rule.method](prop,...rule.args);
    if(result===false){
      if(previousRecovery===undefined)recovery.delete(prop);else recovery.set(prop,previousRecovery);
    }
    return {handled:true,success:result!==false,candidate,
      reason:result===false?'Le dispositif ne peut pas être utilisé dans cet état.':''};
  }
  function executeCollection(map,actor,collection,options={}) {
    const scoped={...options,collections:[collection]},candidate=select(map,actor,scoped);
    if(!candidate)return {handled:true,success:false,candidate:null,
      reason:'Aucun dispositif de cette catégorie n’est utilisable à portée et à découvert.'};
    return execute(map,actor,candidate,scoped);
  }
  function updateDeviceButtons(map,actor,document,options={}) {
    for(const {id,collection}of deviceButtons) {
      const button=document.getElementById(id);if(!button)continue;
      const candidate=options.active?select(map,actor,{...options,collections:[collection]}):null;
      button.disabled=!candidate;
      button.title=candidate?describe(candidate):'Approchez un dispositif de cette catégorie, disponible et accessible sans cloison.';
      button.dataset.contextCollection=collection;
    }
  }
  function bindDeviceButtons(map,actor,stage,document,options={}) {
    const game=options.game;
    for(const {id,collection}of deviceButtons) {
      const button=document.getElementById(id);if(!button)continue;
      button.onclick=()=>{
        if(!game?.campaignActive||game.currentStage!==stage||game.currentStageIndex!==4||game.isSystemPaused||game.isRunning===false)return false;
        const result=executeCollection(map,actor,collection,{humans:game.humans||[]});
        if(!result.success)options.notify?.(result.reason);
        map.interactPromptTimer=0;map.updateInteractionPrompt(0);
        return result.success;
      };
    }
    updateDeviceButtons(map,actor,document,{humans:game?.humans||[],
      active:!!game?.campaignActive&&game.currentStage===stage&&game.currentStageIndex===4&&!game.isSystemPaused&&game.isRunning!==false});
  }
  global.HiveContextualInteractions=Object.freeze({definitions,deviceButtons,select,execute,executeCollection,
    describe,hasSight,updateDeviceButtons,bindDeviceButtons});
})(typeof window==='undefined'?globalThis:window);

