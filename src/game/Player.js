import Phaser from 'phaser';
import { renderPose, RIG } from '../character/rig.js';
import { CLIPS, CLIP_LENGTH } from '../character/poses.js';

export const TEX_SCALE = 2; // character frames are 2× and displayed at 0.5×
const SPEED = 270;
const JUMP_V = -900; // apex ≈ 200 world units with gravity 2000
const RIG_FPS = 24; // the rig redraws "on ones" at 24 fps, like hand-drawn animation

/**
 * The playable character. Physics come from an Arcade sprite.
 *
 * The look comes from one of two sources, chosen per animation clip:
 *  1. Sprite frames listed in /character/sprites/manifest.json (final art), or
 *  2. the layered rig (src/character/rig.js), redrawn into a canvas texture.
 * Clips without sprite frames fall back to the rig, so illustrated frames
 * can be delivered one clip at a time.
 */
export class Player {
  constructor(scene, x, y, spriteClips = {}) {
    this.scene = scene;
    this.rigKey = 'player-rig';
    if (scene.textures.exists(this.rigKey)) scene.textures.remove(this.rigKey);
    this.tex = scene.textures.createCanvas(this.rigKey, RIG.width * TEX_SCALE, RIG.height * TEX_SCALE);
    this.ctx = this.tex.getContext();
    this.spriteClips = spriteClips;

    this.sprite = scene.physics.add.sprite(x, y, this.rigKey);
    this.sprite.setOrigin(RIG.originX / RIG.width, RIG.originY / RIG.height);
    this.sprite.setScale(1 / TEX_SCALE);
    this.sprite.setDepth(50);
    const body = this.sprite.body;
    // body in texture pixels (pre-scale)
    body.setSize(40 * TEX_SCALE, 170 * TEX_SCALE);
    body.setOffset((RIG.width * TEX_SCALE - 40 * TEX_SCALE) / 2, RIG.originY * TEX_SCALE - 170 * TEX_SCALE);
    this.sprite.setCollideWorldBounds(true);

    this.clip = 'idle';
    this.clipT = 0;
    this.override = null; // one-shot or held clip
    this.overrideHold = false;
    this.wasAirborne = false;
    this.facing = 1;
    this.autoTarget = null; // tap-to-walk
    this.locked = false; // computed each frame by the scene
    this.busy = false; // mid-interaction
    this.lastTick = '';
    this.source = 'rig';
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }

  /** Play a one-shot clip (or hold it until release() when hold=true). */
  play(name, { hold = false } = {}) {
    this.override = name;
    this.overrideHold = hold;
    this.clipT = 0;
    this.clip = name;
  }

  release() {
    this.override = null;
    this.overrideHold = false;
  }

  face(dir) {
    if (dir) this.facing = dir > 0 ? 1 : -1;
  }

  walkTo(x, onArrive) {
    this.autoTarget = { x, onArrive };
  }

  update(dt, input, g) {
    const body = this.sprite.body;
    const grounded = body.blocked.down || body.touching.down;
    let move = 0;

    if (!this.locked) {
      if (input.left) move -= 1;
      if (input.right) move += 1;
      if (move !== 0) this.autoTarget = null; // manual input cancels tap-to-walk
      if (this.autoTarget) {
        const dx = this.autoTarget.x - this.sprite.x;
        if (Math.abs(dx) < 10) {
          const cb = this.autoTarget.onArrive;
          this.autoTarget = null;
          cb?.();
        } else move = Math.sign(dx);
      }
      if (input.jumpPressed && grounded) {
        body.setVelocityY(JUMP_V * (this.bounce || 1));
        this.release();
      }
    }

    body.setVelocityX(move * SPEED);
    if (move) {
      this.face(move);
      if (this.override) this.release();
    }

    // choose clip
    let next;
    if (!grounded) next = 'jump';
    else if (this.wasAirborne) next = 'land';
    else if (this.override) next = this.override;
    else if (move) next = 'walk';
    else if (this.clip === 'land' && this.clipT < CLIP_LENGTH.land) next = 'land';
    else next = 'idle';
    this.wasAirborne = !grounded;

    if (next !== this.clip) {
      this.clip = next;
      this.clipT = 0;
    } else this.clipT += dt;

    // one-shot override finished
    const len = CLIP_LENGTH[this.clip];
    if (this.override === this.clip && !this.overrideHold && len && this.clipT > len) {
      this.release();
    }

    this.draw(g, body.velocity.y);
    this.sprite.setFlipX(this.facing < 0);
  }

  draw(g, vy) {
    const sc = this.spriteClips[this.clip];
    if (sc) {
      // illustrated sprite frames
      let f;
      if (this.clip === 'jump') f = Math.min(sc.frames - 1, vy < -250 ? 0 : vy < 150 ? 1 : 2);
      else {
        const n = Math.floor(this.clipT * sc.fps);
        f = sc.loop ? n % sc.frames : Math.min(n, sc.frames - 1);
      }
      if (this.sprite.texture.key !== sc.key || this.sprite.frame.name !== f) this.sprite.setTexture(sc.key, f);
      this.source = 'sprite';
      return;
    }
    if (this.sprite.texture.key !== this.rigKey) this.sprite.setTexture(this.rigKey);
    this.source = 'rig';
    // redraw only when the 24 fps tick, clip or jump phase changes
    const tick = `${this.clip}:${Math.floor(this.clipT * RIG_FPS)}:${Math.floor(g * RIG_FPS)}:${this.clip === 'jump' ? Math.round(vy / 100) : ''}`;
    if (tick === this.lastTick) return;
    this.lastTick = tick;
    const q = (t) => Math.floor(t * RIG_FPS) / RIG_FPS;
    const pose = CLIPS[this.clip](q(this.clipT), q(g), { vy });
    renderPose(this.ctx, pose, { scale: TEX_SCALE, facing: 1 });
    this.tex.refresh();
  }

  /** Top of the head in world coordinates (for speech bubbles). */
  headTop() {
    const seated = this.clip === 'sit' || this.clip === 'work';
    return { x: this.sprite.x, y: this.sprite.y - (seated ? 165 : 210) };
  }
}

/**
 * Read the sprite manifest (already in the Phaser JSON cache) and return the
 * clips whose sheets loaded, as { clip: { key, frames, fps, loop } }.
 */
export function spriteClipsFrom(scene) {
  const m = scene.cache.json.get('char-manifest');
  const out = {};
  if (!m?.clips) return out;
  for (const [clip, def] of Object.entries(m.clips)) {
    const key = `char-${clip}`;
    if (!scene.textures.exists(key) || !CLIPS[clip]) continue;
    out[clip] = { key, frames: def.frames, fps: def.fps || 12, loop: def.loop !== false };
  }
  return out;
}
