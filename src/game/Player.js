import Phaser from 'phaser';
import { renderPose, RIG } from '../character/rig.js';
import { CLIPS, CLIP_LENGTH } from '../character/poses.js';

const TEX_SCALE = 2; // rig is rendered at 2× and displayed at 0.5×
const SPEED = 270;
const JUMP_V = -900; // apex ≈ 200 world units with gravity 2000

/**
 * The playable character. Physics come from an Arcade sprite; the look comes
 * from the articulated rig, re-rendered into a canvas texture every frame.
 */
export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    const key = 'player-rig';
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.tex = scene.textures.createCanvas(key, RIG.width * TEX_SCALE, RIG.height * TEX_SCALE);
    this.ctx = this.tex.getContext();

    this.sprite = scene.physics.add.sprite(x, y, key);
    this.sprite.setOrigin(RIG.originX / RIG.width, RIG.originY / RIG.height);
    this.sprite.setScale(1 / TEX_SCALE);
    this.sprite.setDepth(50);
    const body = this.sprite.body;
    // body in texture pixels (pre-scale)
    body.setSize(40 * TEX_SCALE, 160 * TEX_SCALE);
    body.setOffset((RIG.width * TEX_SCALE - 40 * TEX_SCALE) / 2, RIG.originY * TEX_SCALE - 160 * TEX_SCALE);
    this.sprite.setCollideWorldBounds(true);

    this.clip = 'idle';
    this.clipT = 0;
    this.override = null; // one-shot or held clip (wave/think/interact/celebrate)
    this.overrideHold = false;
    this.wasAirborne = false;
    this.facing = 1;
    this.autoTarget = null; // tap-to-walk
    this.locked = false; // computed each frame by the scene
    this.busy = false; // mid-interaction
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
      if (this.override && !this.overrideHold) this.release();
      if (this.overrideHold) this.release();
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

    const pose = CLIPS[this.clip](this.clipT, g, { vy: body.velocity.y });
    renderPose(this.ctx, pose, { scale: TEX_SCALE, facing: 1 });
    this.tex.refresh();
    this.sprite.setFlipX(this.facing < 0);
  }

  /** Top of the head in world coordinates (for speech bubbles). */
  headTop() {
    return { x: this.sprite.x, y: this.sprite.y - 190 };
  }
}
