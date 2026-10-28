/* HIVE ASCENSION — simulation-driven biological sequence captions and aiming HUD.
 * No timers, input handlers or focus changes: stages own their transitions.
 */
(() => {
  'use strict';

  const state = {
    transition: { opacity: 0, caption: '' },
    cinematic: null,
    eggView: { enabled: false, canLaunch: false, hint: '', target: '' },
    announcement: ''
  };
  let elements = null;
  const MODE_LABELS = Object.freeze({
    'host-cycle': 'CHRONOLOGIE DE L’HÔTE',
    egg: 'PERCEPTION OVOMORPHE',
    facehugger: 'RECHERCHE D’UN HÔTE',
    gestation: 'CROISSANCE INTERNE',
    chrysalis: 'MUE BIOMÉCANIQUE',
    emergence: 'ÉMERGENCE ADULTE'
  });

  function node(tag, className, text = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function setText(element, value) {
    const text = String(value || '');
    if (element.textContent !== text) element.textContent = text;
  }

  function setAttribute(element, key, value) {
    const text = String(value);
    if (element.getAttribute(key) !== text) element.setAttribute(key, text);
  }

  function ensure() {
    if (elements) return elements;
    const app = document.getElementById('app-container');
    if (!app) return null;

    const transition = node('div', 'evolution-transition');
    transition.id = 'evolution-transition';
    transition.setAttribute('aria-hidden', 'true');
    const caption = node('p', 'evolution-transition-caption');
    transition.append(caption);

    const cinematic = node('section', 'evolution-cinematic');
    cinematic.id = 'evolution-cinematic';
    cinematic.hidden = true;
    cinematic.setAttribute('aria-label', 'Étape du cycle biologique');
    const heading = node('div', 'evolution-cinematic-heading');
    const kicker = node('span', 'evolution-cinematic-kicker', 'CYCLE BIOLOGIQUE');
    const percent = node('span', 'evolution-cinematic-percent');
    percent.setAttribute('aria-hidden', 'true');
    heading.append(kicker, percent);
    const title = node('strong', 'evolution-cinematic-title');
    const detail = node('p', 'evolution-cinematic-detail');
    const progress = node('div', 'evolution-cinematic-progress');
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', 'Progression de la séquence');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    const fill = node('span', 'evolution-cinematic-fill');
    progress.append(fill);
    cinematic.append(heading, title, detail, progress);

    const egg = node('div', 'egg-view-overlay');
    egg.id = 'egg-view-overlay';
    egg.hidden = true;
    egg.setAttribute('aria-hidden', 'true');
    const eyeLabel = node('div', 'egg-view-label', 'PERCEPTION DU FACEHUGGER // DANS L’ŒUF');
    const reticle = node('div', 'egg-view-reticle');
    reticle.append(node('span', 'egg-view-reticle-center'));
    const aim = node('div', 'egg-view-aim');
    const aimTitle = node('strong', 'egg-view-aim-title');
    const hint = node('span', 'egg-view-aim-hint');
    aim.append(aimTitle, hint);
    egg.append(eyeLabel, reticle, aim);

    const live = node('div', 'evolution-announcement');
    live.id = 'evolution-announcement';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');

    app.append(egg, cinematic, transition, live);
    elements = { app, transition, caption, cinematic, title, detail,
      kicker, percent, progress, fill, egg, aimTitle, hint, live };
    return elements;
  }

  function renderTransition() {
    const ui = ensure();
    if (!ui) return;
    const { opacity, caption } = state.transition;
    const rounded = Math.round(opacity * 1000) / 1000;
    if (ui.transition.style.opacity !== String(rounded)) ui.transition.style.opacity = String(rounded);
    ui.transition.hidden = rounded <= 0;
    setAttribute(ui.transition, 'aria-hidden', rounded <= 0 || !caption);
    setText(ui.caption, caption);
  }

  function renderCinematic() {
    const ui = ensure();
    if (!ui) return;
    const value = state.cinematic;
    ui.cinematic.hidden = !value;
    ui.app.classList.toggle('has-evolution-cinematic', !!value);
    if (!value) return;
    setText(ui.title, value.title);
    setText(ui.detail, value.detail);
    setText(ui.kicker, MODE_LABELS[value.mode] || (value.mode ? String(value.mode).replace(/[_-]/g, ' ').toUpperCase() : 'CYCLE BIOLOGIQUE'));
    if (ui.cinematic.dataset.mode !== value.mode) ui.cinematic.dataset.mode = value.mode;
    const hasProgress = Number.isFinite(value.progress);
    ui.progress.hidden = !hasProgress;
    ui.percent.hidden = !hasProgress;
    if (hasProgress) {
      const progress = Math.round(Math.max(0, Math.min(1, value.progress)) * 100);
      setAttribute(ui.progress, 'aria-valuenow', progress);
      setAttribute(ui.progress, 'aria-label', value.title || 'Progression de la séquence');
      setText(ui.percent, `${progress} %`);
      if (ui.fill.style.width !== `${progress}%`) ui.fill.style.width = `${progress}%`;
    }
  }

  function renderEggView() {
    const ui = ensure();
    if (!ui) return;
    const value = state.eggView;
    ui.egg.hidden = !value.enabled;
    ui.app.classList.toggle('is-egg-view', value.enabled);
    ui.egg.classList.toggle('egg-view-ready', value.canLaunch);
    setText(ui.aimTitle, value.target || (value.canLaunch ? 'TRAJECTOIRE DE SORTIE LIBRE' : 'OBSERVER PAR LES PÉTALES'));
    setText(ui.hint, value.hint || 'Visez avec la souris · Clic gauche : bondir · Le bouton à l’écran fonctionne au toucher');
  }

  function announce(message) {
    state.announcement = String(message || '');
    const ui = ensure();
    if (ui) setText(ui.live, state.announcement);
  }

  function setCinematic(value = {}) {
    const oldTitle = state.cinematic?.title;
    state.cinematic = {
      title: String(value.title || ''),
      detail: String(value.detail || ''),
      progress: Number.isFinite(value.progress) ? value.progress : null,
      mode: String(value.mode || '')
    };
    renderCinematic();
    if (oldTitle !== state.cinematic.title) {
      announce([state.cinematic.title, state.cinematic.detail].filter(Boolean).join('. '));
    }
  }

  function clearCinematic() {
    state.cinematic = null;
    renderCinematic();
  }

  function setTransition(opacity, caption = '') {
    const numericOpacity = Number(opacity);
    state.transition = {
      opacity: Number.isFinite(numericOpacity) ? Math.max(0, Math.min(1, numericOpacity)) : 0,
      caption: String(caption || '')
    };
    renderTransition();
  }

  function setEggView(enabled, options = {}) {
    const wasEnabled = state.eggView.enabled;
    state.eggView = {
      enabled: !!enabled,
      canLaunch: !!options.canLaunch,
      hint: String(options.hint || ''),
      target: String(options.target || '')
    };
    renderEggView();
    if (state.eggView.enabled && !wasEnabled) {
      announce('Vue depuis l’intérieur de l’œuf. Visez avec la souris et cliquez pour bondir. Le bouton à l’écran permet aussi de bondir au toucher.');
    }
  }

  function reset() {
    setTransition(0);
    clearCinematic();
    setEggView(false);
    announce('');
  }

  window.HiveEvolutionUI = Object.freeze({ setTransition, setCinematic, clearCinematic, setEggView, reset, announce });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderTransition();
      renderCinematic();
      renderEggView();
      announce(state.announcement);
    }, { once: true });
  } else reset();
})();
