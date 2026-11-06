import Phaser from 'phaser';
import { Player, spriteClipsFrom } from './Player.js';
import { ROOMS, ROOM_BY_ID, DISCOVERABLES } from '../world/rooms.js';
import { OBJECTS, paintTexture, paintRoom, paintSky, FLOOR_Y, WORLD_H } from '../world/paint.js';
import { isPendingPanel } from '../ui/render.js';
import { state, persist, bus, touchInput } from '../state.js';

const GROUND = FLOOR_Y + 26; // where feet rest on the floor
const OBJ_GROUND = FLOOR_Y + 14; // floor-standing furniture sits slightly behind the character
const OBJ_R = 2; // object texture resolution

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('world');
  }

  init(data) {
    this.room = ROOM_BY_ID[data?.roomId] || ROOMS[0];
    this.spawnX = data?.spawnX ?? this.room.spawn;
    this.arrivedBy = data?.arrivedBy || 'start';
    this.transitioning = false;
  }

  preload() {
    this.load.image('poster-lostinn', '/evidence/posters/lostinn-cms.jpg');
    this.load.image('poster-reviewsetu', '/evidence/posters/reviewsetu.jpg');
    this.load.image('ev-resolveai', '/evidence/resolveai-automation-workflow.png');
    // Illustrated character sprite sheets (optional): any clip listed in the
    // manifest replaces the code-drawn rig for that clip only.
    if (!this.cache.json.exists('char-manifest')) {
      this.load.json('char-manifest', '/character/sprites/manifest.json');
      this.load.once('filecomplete-json-char-manifest', (key, type, m) => {
        for (const [clip, def] of Object.entries(m?.clips || {})) {
          this.load.spritesheet(`char-${clip}`, `/character/sprites/${def.sheet}`, {
            frameWidth: m.frameWidth || 340,
            frameHeight: m.frameHeight || 500,
          });
        }
      });
    }
  }

  create() {
    const room = this.room;
    state.room = room.id;
    const W = room.width;
    this.physics.world.setBounds(0, -400, W, WORLD_H + 400);
    this.cameras.main.setBounds(0, 0, W, WORLD_H);

    this.buildBackdrop(room);
    this.objects = [];
    this.platforms = this.physics.add.staticGroup();

    // floor
    const floor = this.add.zone(W / 2, GROUND + 20, W, 40);
    this.physics.add.existing(floor, true);

    for (const def of room.objects) this.buildObject(def);
    if (!state.reducedMotion) this.makeAmbient(room);

    this.player = new Player(this, this.spawnX, GROUND - 2, spriteClipsFrom(this));
    this.physics.add.collider(this.player.sprite, floor);
    this.physics.add.collider(this.player.sprite, this.platforms, (pl, zone) => this.onPlatform(zone));

    // camera
    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, state.reducedMotion ? 1 : 0.09, 1, 0, 60);
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitCamera, this));

    // input (no key capture, so DOM panels, videos and page keys keep working)
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard;
    this.keys = {
      left: [kb.addKey(K.LEFT, false), kb.addKey(K.A, false)],
      right: [kb.addKey(K.RIGHT, false), kb.addKey(K.D, false)],
      jump: [kb.addKey(K.UP, false), kb.addKey(K.W, false), kb.addKey(K.SPACE, false)],
      action: [kb.addKey(K.E, false), kb.addKey(K.ENTER, false)],
    };
    this.prevTouch = { jump: false, action: false };
    // Queue presses from the keydown event itself: polling JustDown misses a tap
    // whose key-down and key-up land in the same frame (fast taps, slow devices).
    this.pending = { jump: false, action: false };
    const queue = (name) => (e) => {
      if (!e.repeat && !state.uiOpen) this.pending[name] = true;
    };
    const keyEvents = [...['E', 'ENTER'].map((k) => [k, queue('action')]), ...['SPACE', 'UP', 'W'].map((k) => [k, queue('jump')])];
    keyEvents.forEach(([k, fn]) => kb.on(`keydown-${k}`, fn));
    this.events.once('shutdown', () => keyEvents.forEach(([k, fn]) => kb.off(`keydown-${k}`, fn)));

    // click the character to say hi
    this.player.sprite.setInteractive({ useHandCursor: true, pixelPerfect: false });
    this.player.sprite.on('pointerdown', () => {
      if (state.uiOpen || this.player.busy) return;
      this.hiCount = (this.hiCount || 0) + 1;
      if (this.hiCount % 2) {
        this.player.play('wave');
        bus.emit('say', { text: 'Hi! Anything that glows can be opened.', ms: 2600 });
      } else {
        this.player.play('laugh');
        bus.emit('say', { text: 'Haha — that tickles!', ms: 1800 });
      }
    });

    // events from the DOM UI
    const offs = [
      bus.on('goto', ({ roomId }) => this.goTo(roomId)),
      bus.on('panel-closed', () => this.onPanelClosed()),
      bus.on('reduced-motion', () => cam.setLerp(state.reducedMotion ? 1 : 0.09, 1)),
    ];
    this.events.once('shutdown', () => offs.forEach((off) => off()));

    // arrival
    const first = !state.visitedRooms.has(room.id);
    state.visitedRooms.add(room.id);
    persist();
    if (!state.reducedMotion && this.arrivedBy === 'start') cam.fadeIn(320, 251, 243, 228);
    bus.emit('room', { room, first, arrivedBy: this.arrivedBy });
    if (first && this.arrivedBy !== 'start') {
      this.time.delayedCall(450, () => bus.emit('say', { text: room.intro, ms: 4200 }));
    }
    this.bounces = [];
  }

  /* ---------------------------------------------------------------- */
  buildBackdrop(room) {
    const W = room.width;
    // drop other rooms' large textures to keep memory low on phones
    for (const r of ROOMS) {
      if (r.id === room.id) continue;
      ['sky-', 'wall-'].forEach((p) => this.textures.exists(p + r.id) && this.textures.remove(p + r.id));
    }
    const skyKey = 'sky-' + room.id;
    if (!this.textures.exists(skyKey)) paintTexture(this, skyKey, W, WORLD_H, 0.75, (ctx, w, h) => paintSky(ctx, w, h, room));
    this.add.image(0, 0, skyKey).setOrigin(0).setScale(1 / 0.75).setScrollFactor(0.3, 1).setDepth(0);

    if (room.paint.open) {
      // extra mid-distance cloud layer for depth in the open Dream Space
      const midKey = 'mid-' + room.id;
      if (!this.textures.exists(midKey))
        paintTexture(this, midKey, W, WORLD_H, 0.75, (ctx, w) => {
          ctx.fillStyle = 'rgba(244,238,252,0.35)';
          for (let x = 120; x < w; x += 420) {
            ctx.beginPath();
            ctx.ellipse(x, 470 + (x % 3) * 30, 140, 30, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      this.add.image(0, 0, midKey).setOrigin(0).setScale(1 / 0.75).setScrollFactor(0.6, 1).setDepth(1);
      if (!state.reducedMotion) this.makeDreamSparkles(W);
    }
    const wallKey = 'wall-' + room.id;
    const R = 1.25;
    if (!this.textures.exists(wallKey)) paintTexture(this, wallKey, W, WORLD_H, R, (ctx, w, h) => paintRoom(ctx, w, h, room));
    this.add.image(0, 0, wallKey).setOrigin(0).setScale(1 / R).setDepth(2);
    this.cameras.main.setBackgroundColor(room.sky.colors[room.sky.colors.length - 1]);
  }

  /** Slow floating dust motes or leaves, one style per room. */
  makeAmbient(room) {
    const a = room.ambient;
    if (!a) return;
    const key = `amb-${a.kind}`;
    if (!this.textures.exists(key)) {
      paintTexture(this, key, 14, 14, 2, (ctx) => {
        if (a.kind === 'leaves') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(7, 7, 3, 6, 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const g = ctx.createRadialGradient(7, 7, 0, 7, 7, 7);
          g.addColorStop(0, 'rgba(255,255,255,1)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 14, 14);
        }
      });
    }
    const leaves = a.kind === 'leaves';
    this.add
      .particles(0, 0, key, {
        x: { min: 0, max: room.width },
        y: leaves ? { min: -10, max: 40 } : { min: 120, max: FLOOR_Y - 20 },
        lifespan: leaves ? 9000 : 6000,
        speedX: leaves ? { min: -20, max: 25 } : { min: -6, max: 6 },
        speedY: leaves ? { min: 30, max: 55 } : { min: -10, max: -3 },
        rotate: leaves ? { min: 0, max: 360 } : 0,
        scale: leaves ? { min: 0.5, max: 0.9 } : { min: 0.3, max: 0.8 },
        alpha: { onEmit: () => 0, onUpdate: (p, k, t) => Math.sin(t * Math.PI) * (leaves ? 0.7 : 0.55) },
        tint: a.color,
        frequency: leaves ? 900 : 380,
        quantity: 1,
      })
      .setDepth(leaves ? 45 : 6);
  }

  makeDreamSparkles(W) {
    if (!this.textures.exists('sparkle')) {
      paintTexture(this, 'sparkle', 12, 12, 2, (ctx) => {
        const g = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
        g.addColorStop(0, 'rgba(255,248,220,1)');
        g.addColorStop(1, 'rgba(255,248,220,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 12, 12);
      });
    }
    this.add
      .particles(0, 0, 'sparkle', {
        x: { min: 0, max: W },
        y: { min: 60, max: 560 },
        lifespan: 3200,
        alpha: { onEmit: () => 0, onUpdate: (p, k, t) => Math.sin(t * Math.PI) },
        scale: { min: 0.4, max: 1.1 },
        quantity: 1,
        frequency: 160,
        speedY: { min: -8, max: -2 },
      })
      .setDepth(3);
  }

  buildObject(def) {
    const spec = OBJECTS[def.kind];
    if (!spec) return;
    const [w, h] = spec.size;
    const padTop = spec.padTop || 0;
    const key = `obj-${def.id}`;
    if (!this.textures.exists(key))
      paintTexture(this, key, w, h + padTop, OBJ_R, (ctx) => {
        ctx.translate(0, padTop);
        spec.draw(ctx, w, h, def.opts || {});
      });
    const y = def.y ?? OBJ_GROUND;
    const [sx, sy] = def.scale || [1, 1];
    const img = this.add.image(def.x, y, key).setOrigin(0.5, 1).setScale(sx / OBJ_R, sy / OBJ_R);
    img.setDepth(def.depth ?? (def.kind === 'window' || def.kind === 'console' ? 4 : 10));
    const obj = { def, img, w: w * sx, h: h * sy, x: def.x, y, interactive: !!(def.panel || def.door || def.sit) };

    if (def.evidence) this.placeEvidence(obj, def.evidence);

    if (def.platform) {
      const topY = y - h * sy + def.platform.top * sy;
      const zone = this.add.zone(def.x, topY + 8, def.platform.w, 16);
      this.physics.add.existing(zone, true);
      zone.body.checkCollision.down = false;
      zone.body.checkCollision.left = false;
      zone.body.checkCollision.right = false;
      zone.objId = def.id;
      this.platforms.add(zone);
    }

    if (obj.interactive) {
      img.setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => this.tapObject(obj));
    }
    if (def.kind === 'plant' && !state.reducedMotion) {
      // leaves sway gently from the pot (origin is bottom-centre)
      this.tweens.add({ targets: img, angle: { from: -1.2, to: 1.2 }, duration: 2800 + (def.x % 900), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (def.kind === 'mobile' && !state.reducedMotion) {
      this.tweens.add({ targets: img, angle: { from: -2, to: 2 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (def.kind === 'cloudPlatform' && !state.reducedMotion) {
      this.tweens.add({ targets: img, y: y - 6, duration: 2200 + def.x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.objects.push(obj);
  }

  /** Put real project evidence on a studio monitor (cover-cropped). */
  placeEvidence(obj, ev) {
    const sw = 174;
    const sh = 100;
    const cx = obj.x;
    const cy = obj.y - obj.h + 8 + sh / 2;
    if (ev.image && this.textures.exists(ev.image)) {
      const im = this.add.image(cx, cy, ev.image).setDepth(11);
      const f = im.frame;
      const s = Math.max(sw / f.width, sh / f.height);
      const cw = sw / s;
      const ch = sh / s;
      im.setCrop((f.width - cw) / 2, (f.height - ch) / 2, cw, ch);
      im.setScale(s);
      obj.evidenceImg = im;
    } else if (ev.stat) {
      const g = this.add.graphics().setDepth(11);
      g.fillStyle(0xd9cdec, 1);
      g.fillRoundedRect(cx - sw / 2, cy - sh / 2, sw, sh, 4);
      // a simple bar showing the real 91.2% figure
      g.fillStyle(0xffffff, 0.7);
      g.fillRoundedRect(cx - 70, cy + 22, 140, 10, 5);
      g.fillStyle(0x7d6aa6, 1);
      g.fillRoundedRect(cx - 70, cy + 22, 140 * 0.912, 10, 5);
      this.add.text(cx, cy - 12, ev.stat, { fontFamily: 'Fraunces, Georgia, serif', fontSize: '34px', color: '#3a2720', fontStyle: '600', resolution: 2 }).setOrigin(0.5).setDepth(12);
      this.add.text(cx, cy + 12, ev.sub, { fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '11px', color: '#5a3d31', resolution: 2 }).setOrigin(0.5).setDepth(12);
    }
  }

  fitCamera() {
    const cam = this.cameras.main;
    const { width, height } = this.scale.gameSize;
    const zoom = Math.max(Math.min(height / WORLD_H, width / 470), width / this.room.width);
    cam.setZoom(Math.min(zoom, 2.4));
    cam.setSize(width, height);
  }

  /* ---------------------------------------------------------------- */
  readInput() {
    const down = (arr) => arr.some((k) => k.isDown);
    const ui = state.uiOpen;
    const jt = touchInput.jump && !this.prevTouch.jump;
    const at = touchInput.action && !this.prevTouch.action;
    this.prevTouch = { jump: touchInput.jump, action: touchInput.action };
    const jumpPressed = this.pending.jump || jt;
    const actionPressed = this.pending.action || at;
    this.pending.jump = false;
    this.pending.action = false;
    if (ui) return { left: false, right: false, jumpPressed: false, actionPressed: false };
    return {
      left: down(this.keys.left) || touchInput.left,
      right: down(this.keys.right) || touchInput.right,
      jumpPressed,
      actionPressed,
    };
  }

  nearestInteractive() {
    const px = this.player.x;
    const py = this.player.y;
    let best = null;
    let bestD = Infinity;
    for (const o of this.objects) {
      if (!o.interactive) continue;
      const hx = o.x + (o.def.hotspot || 0);
      const dx = Math.abs(px - hx);
      let ok;
      if (o.def.reach === 'near') {
        const d = Math.hypot(px - hx, py - 90 - (o.y - o.h / 2));
        ok = d < (o.def.range || 150);
      } else {
        const range = o.def.range || Math.max(60, Math.min(o.w / 2 + 10, 115));
        ok = dx < range;
      }
      if (ok && dx < bestD) {
        bestD = dx;
        best = o;
      }
    }
    return best;
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const input = this.readInput();
    this.player.locked = this.transitioning || state.uiOpen || this.player.busy;
    this.player.update(dt, input, time / 1000);

    // proximity highlight + prompt
    const near = !state.uiOpen && !this.transitioning ? this.nearestInteractive() : null;
    if (near !== this.highlighted) {
      this.setHighlight(this.highlighted, false);
      this.setHighlight(near, true);
      this.highlighted = near;
    }
    if (input.actionPressed && near) this.interact(near);

    // positions for DOM overlays (prompt + speech bubble)
    const cam = this.cameras.main;
    const toScreen = (x, y) => ({ x: (x - cam.worldView.x) * cam.zoom, y: (y - cam.worldView.y) * cam.zoom });
    const head = this.player.headTop();
    bus.emit('frame', {
      head: toScreen(head.x, head.y),
      prompt: near
        ? {
            id: near.def.id,
            label: near.def.door ? `Go to · ${near.def.label}` : near.def.label,
            ...toScreen(near.x + (near.def.hotspot || 0), Math.max(40, near.y - near.h - 14)),
          }
        : null,
    });
  }

  setHighlight(o, on) {
    if (!o) return;
    const img = o.img;
    if (on) {
      if (img.preFX) o.glow = img.preFX.addGlow(0xfff4d6, 6, 0, false, 0.1, 12);
      else img.setTint(0xfff6e6);
      if (!state.reducedMotion) o.pulse = this.tweens.add({ targets: img, scaleX: img.scaleX * 1.015, scaleY: img.scaleY * 1.015, duration: 600, yoyo: true, repeat: -1 });
    } else {
      if (img.preFX) img.preFX.clear();
      else img.clearTint();
      if (o.pulse) {
        o.pulse.stop();
        o.pulse = null;
        const [sx, sy] = o.def.scale || [1, 1];
        img.setScale(sx / OBJ_R, sy / OBJ_R);
      }
    }
  }

  tapObject(obj) {
    if (state.uiOpen || this.transitioning) return;
    const hx = obj.x + (obj.def.hotspot || 0);
    if (obj.def.reach === 'near') {
      // the moon has to be reached by climbing; tapping just points the way
      if (this.nearestInteractive() === obj) this.interact(obj);
      else bus.emit('say', { text: 'Too high! Maybe the clouds can help me up.', ms: 2600 });
      return;
    }
    const side = this.player.x < hx ? -1 : 1;
    const target = Phaser.Math.Clamp(hx + side * 36, 40, this.room.width - 40);
    this.player.walkTo(target, () => {
      this.player.face(hx - this.player.x);
      this.interact(obj);
    });
  }

  interact(obj) {
    const p = this.player;
    if (p.locked || p.busy) return;
    p.face(obj.x + (obj.def.hotspot || 0) - p.x);
    const def = obj.def;
    const delay = state.reducedMotion ? 120 : 420;
    if (def.door) {
      p.play('interact');
      p.busy = true;
      this.time.delayedCall(delay, () => this.goTo(def.door.to, def.door.spawn, def.id === 'window' ? 'window' : 'door'));
      return;
    }
    if (def.sit) {
      // a seat: walk to it and sit until the visitor moves again
      const sitDown = () => {
        p.face(1);
        p.play('sit', { hold: true });
        if (def.say) bus.emit('say', { text: def.say, ms: 2600 });
      };
      if (Math.abs(p.x - def.x) > 10) p.walkTo(def.x, sitDown);
      else sitDown();
      return;
    }
    if (def.seat !== undefined && Math.abs(p.x - def.seat) > 10) {
      // e.g. the laptop: sit down at the desk first, then open
      p.walkTo(def.seat, () => this.interact(obj));
      return;
    }
    const pending = isPendingPanel(def.panel);
    const clip = def.clip || (pending ? 'think' : 'interact');
    if (def.seat !== undefined) p.face(1);
    p.play(clip, { hold: clip === 'think' || clip === 'work' });
    p.busy = true;
    const isNew = !state.discovered.has(def.id);
    state.discovered.add(def.id);
    persist();
    this.time.delayedCall(delay, () => bus.emit('open-panel', { panel: def.panel, objectId: def.id, isNew }));
  }

  onPanelClosed() {
    if (!this.player) return;
    this.player.busy = false;
    this.player.release();
    const total = DISCOVERABLES.length;
    if (state.discovered.size >= total && !state.celebrated) {
      state.celebrated = true;
      this.celebrate('You’ve opened everything in my world. Thank you for exploring!');
    }
  }

  onPlatform(zone) {
    // hidden detail: the bed is bouncy
    if (zone.objId !== 'bed') {
      this.player.bounce = 1;
      return;
    }
    this.player.bounce = 1.22;
    const body = this.player.sprite.body;
    if (body.touching.down && this.player.wasAirborne) {
      const now = this.time.now;
      // several physics steps can run per frame; count each landing once
      if (now - (this.bounces[this.bounces.length - 1] || -1e9) < 300) return;
      this.bounces = this.bounces.filter((t) => now - t < 5000);
      this.bounces.push(now);
      if (this.bounces.length >= 3 && !this.bedSecret) {
        this.bedSecret = true;
        this.celebrate('Okay, you found the bouncy bed.');
      }
    }
  }

  celebrate(text) {
    this.player.play('celebrate');
    bus.emit('say', { text, ms: 3600 });
    if (state.reducedMotion) return;
    if (!this.textures.exists('confetti')) {
      paintTexture(this, 'confetti', 8, 12, 2, (ctx) => {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 8, 12);
      });
    }
    const colors = [0xb9a7d6, 0xe8b4bc, 0xb5dcc4, 0xf6dfa0, 0xf2c4a6];
    const em = this.add
      .particles(this.player.x, this.player.y - 200, 'confetti', {
        speed: { min: 120, max: 360 },
        angle: { min: 200, max: 340 },
        gravityY: 600,
        lifespan: 1600,
        rotate: { min: 0, max: 360 },
        scale: { min: 0.6, max: 1 },
        tint: colors,
        emitting: false,
      })
      .setDepth(60);
    em.explode(60);
    this.time.delayedCall(1800, () => em.destroy());
  }

  goTo(roomId, spawnX, arrivedBy = 'map') {
    if (this.transitioning || !ROOM_BY_ID[roomId]) return;
    this.transitioning = true;
    bus.emit('prompt-clear');
    const go = () => this.scene.restart({ roomId, spawnX: spawnX ?? ROOM_BY_ID[roomId].spawn, arrivedBy });
    if (state.reducedMotion) go();
    else {
      // the DOM curtain (hud.js) covers the switch and names the next room
      bus.emit('leaving', { room: ROOM_BY_ID[roomId] });
      this.time.delayedCall(360, go);
    }
  }
}
