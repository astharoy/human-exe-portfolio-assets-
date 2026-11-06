import Phaser from 'phaser';
import './styles.css';
import { WorldScene } from './game/WorldScene.js';
import { initPanel } from './ui/panel.js';
import { initHud } from './ui/hud.js';
import { renderFallback } from './ui/fallback.js';
import { state, bus } from './state.js';
import { ROOMS } from './world/rooms.js';

let game = null;
const listEl = document.getElementById('list');
const worldEl = document.getElementById('world');

function showList() {
  if (!listEl.dataset.ready) {
    renderFallback(listEl);
    listEl.dataset.ready = '1';
  }
  listEl.hidden = false;
  worldEl.hidden = true;
  game?.loop.sleep();
  listEl.querySelector('h1')?.focus();
  window.scrollTo(0, 0);
}

function showWorld() {
  listEl.hidden = true;
  worldEl.hidden = false;
  if (!game) startGame();
  else game.loop.wake();
}

function startGame() {
  initPanel();
  initHud();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#fbf3e4',
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 2000 }, debug: false } },
    render: { antialias: true, roundPixels: false },
    input: { keyboard: { target: window } },
    // real frame deltas, so movement speed is correct on slow devices too
    fps: { smoothStep: false },
    scene: [WorldScene],
  });
  bus.on('start', () => {
    bus.emit('say', { text: 'Hi, I’m Aastha! Welcome to my little world. Walk around — anything that glows can be opened.', ms: 5200 });
    const scene = game.scene.getScene('world');
    scene?.player?.play('wave');
  });
  // debugging/testing hook (used by the smoke test)
  window.__digitalMe = { game, state, bus, rooms: ROOMS.map((r) => r.id) };
}

function route() {
  if (location.hash === '#list') showList();
  else showWorld();
}
window.addEventListener('hashchange', route);
route();
