/**
 * The five interconnected spaces from DIGITAL_ME.md §4.
 *
 * Object fields:
 *   id      unique id (also the discovery key)
 *   kind    painter in paint.js (OBJECTS[kind])
 *   x, y    bottom-centre in world units (y defaults to the floor)
 *   panel   content key in content.js → PANELS (interactive objects)
 *   door    { to, spawn } — a doorway into another room
 *   label   short prompt label
 *   platform { w, top } — a one-way surface the character can stand on
 *   opts    painter options
 *   evidence { src, poster } — real project image placed on a monitor
 *   clip    character clip played on interaction (default 'interact')
 */
import { C } from '../palette.js';
import { FLOOR_Y } from './paint.js';

const wood = {
  floor: '#c9a27c', floorHi: '#d8b58f', floorLine: 'rgba(90,61,49,0.18)',
};

export const ROOMS = [
  {
    id: 'my-room',
    num: '01',
    name: 'My Room',
    purpose: 'Introduction and personality',
    intro: 'Welcome to my room! Look around — the mirror is a good place to start.',
    width: 2000,
    seed: 11,
    sky: { colors: ['#f7d9c9', '#f4e3d4', '#fbefd9'], cloud: '#fffaf1', sun: [520, 160], hills: ['#e8c9c3', '#dcb6b3'] },
    paint: { wallTop: '#f6dde0', wall: '#f2cfd5', motif: 'rgba(255,255,255,0.45)', pattern: 'dots', wainscot: '#f6e7d6', wainscotLine: 'rgba(201,134,146,0.35)', trim: C.cream, ...wood },
    windows: [{ x: 760, y: 150, w: 240, h: 230 }],
    windowArch: true,
    rugs: [[1130, 420, C.lavender, C.lavenderSoft]],
    spawn: 260,
    objects: [
      { id: 'door-home-studio', kind: 'door', x: 1880, door: { to: 'studio', spawn: 200 }, label: 'Creative Studio', opts: { color: C.lavenderDeep, plaque: '02' } },
      { id: 'lamp-1', kind: 'lamp', x: 90 },
      { id: 'mirror', kind: 'mirror', x: 300, panel: 'mirror', label: 'Mirror · About me', clip: 'wave' },
      { id: 'bed', kind: 'bed', x: 560, platform: { w: 280, top: 52 } },
      { id: 'window', kind: 'window', x: 760, y: 150 + 230, door: { to: 'dream', spawn: 260 }, label: 'Window · Drift into the Dream Space', opts: { arch: true, curtain: C.pink } },
      { id: 'photos', kind: 'photos', x: 1060, y: 330, panel: 'photos', label: 'Photographs · Memories', reach: 'floor' },
      { id: 'plant-1', kind: 'plant', x: 1240 },
      { id: 'bookshelf', kind: 'bookshelf', x: 1460, panel: 'bookshelf', label: 'Bookshelf · Interests', opts: { seed: 4 } },
      { id: 'plant-2', kind: 'plant', x: 1660 },
    ],
  },
  {
    id: 'studio',
    num: '02',
    name: 'Creative Studio',
    purpose: 'My work and projects',
    intro: 'My studio — everything I’ve built lives here. Each screen is a project.',
    width: 2600,
    seed: 22,
    sky: { colors: ['#cfe7ef', '#e3eef0', '#f3f0e6'], cloud: '#ffffff', hills: ['#c9dccf', '#b4cfbf'] },
    paint: { wallTop: '#e4dbf0', wall: '#d9cdec', motif: 'rgba(255,255,255,0.35)', pattern: 'grid', wainscot: '#d8eedf', wainscotLine: 'rgba(127,181,150,0.4)', trim: '#f4efe6', ...wood },
    windows: [{ x: 2230, y: 120, w: 240, h: 230 }],
    rugs: [[560, 520, C.mint, C.mintSoft], [1520, 760, C.butter, C.butterSoft]],
    spawn: 200,
    objects: [
      { id: 'door-studio-home', kind: 'door', x: 90, door: { to: 'my-room', spawn: 1760 }, label: 'My Room', opts: { color: C.pinkDeep, plaque: '01' } },
      { id: 'desk', kind: 'desk', x: 560, panel: 'desk', label: 'Desk · Skills & tools', hotspot: -110, platform: { w: 370, top: 0 } },
      { id: 'laptop', kind: 'laptop', x: 650, y: FLOOR_Y - 130, panel: 'laptop', label: 'Laptop · Project showcase', reach: 'floor' },
      { id: 'plant-s1', kind: 'plant', x: 860 },
      { id: 'console', kind: 'console', x: 1520 },
      { id: 'screen-lostinn', kind: 'monitor', x: 1176, y: 330, panel: 'screen-lostinn', label: 'Screen · The Lost Inn', reach: 'floor', evidence: { image: 'poster-lostinn' }, opts: { led: C.butter } },
      { id: 'screen-resolveai', kind: 'monitor', x: 1406, y: 330, panel: 'screen-resolveai', label: 'Screen · ResolveAI', reach: 'floor', evidence: { image: 'ev-resolveai' }, opts: { led: C.mint } },
      { id: 'screen-reviewsetu', kind: 'monitor', x: 1636, y: 330, panel: 'screen-reviewsetu', label: 'Screen · ReviewSetu', reach: 'floor', evidence: { image: 'poster-reviewsetu' }, opts: { led: C.pink } },
      { id: 'screen-dispute-sla', kind: 'monitor', x: 1866, y: 330, panel: 'screen-dispute-sla', label: 'Screen · Dispute SLA Analytics', reach: 'floor', evidence: { stat: '91.2%', sub: 'closed cases within SLA' }, opts: { led: C.lavender } },
      { id: 'notebook', kind: 'sidetable', x: 2130, panel: 'notebook', label: 'Notebook · Ideas & experiments' },
      { id: 'door-studio-curio', kind: 'door', x: 2510, door: { to: 'curiosity', spawn: 200 }, label: 'Curiosity Corner', opts: { color: C.mintDeep, plaque: '03' } },
    ],
  },
  {
    id: 'curiosity',
    num: '03',
    name: 'Curiosity Corner',
    purpose: 'Learning and exploration',
    intro: 'The Curiosity Corner — where I keep what I’m learning.',
    width: 2200,
    seed: 33,
    sky: { colors: ['#fbe7b9', '#f8efd2', '#f4f1e2'], cloud: '#fffdf4', sun: [1400, 120], hills: ['#d6e6cd', '#c1d8b6'] },
    paint: { wallTop: '#e2f1e6', wall: '#d8eedf', motif: 'rgba(127,181,150,0.22)', pattern: 'sprigs', wainscot: '#fbefc9', wainscotLine: 'rgba(214,170,90,0.35)', trim: C.cream, floor: '#c6a07c', floorHi: '#d5b28d', floorLine: 'rgba(90,61,49,0.18)' },
    windows: [{ x: 1180, y: 130, w: 240, h: 230 }],
    windowArch: true,
    rugs: [[820, 460, C.peach, C.butterSoft]],
    spawn: 200,
    objects: [
      { id: 'door-curio-studio', kind: 'door', x: 90, door: { to: 'studio', spawn: 2380 }, label: 'Creative Studio', opts: { color: C.lavenderDeep, plaque: '02' } },
      { id: 'curio-bookshelf', kind: 'bookshelf', x: 400, panel: 'curio-bookshelf', label: 'Bookshelf · What I’m learning', platform: { w: 210, top: 6 }, scale: [1.2, 1.15], opts: { seed: 9, wood: C.peachDeep } },
      { id: 'curio-computer', kind: 'pcdesk', x: 720, panel: 'curio-computer', label: 'Computer · Explorations', platform: { w: 210, top: 110 } },
      { id: 'window-c', kind: 'window', x: 1180, y: 130 + 230, opts: { arch: true, curtain: C.butter } },
      { id: 'curio-notes', kind: 'lectern', x: 1000, panel: 'curio-notes', label: 'Research notes' },
      { id: 'plant-c1', kind: 'plant', x: 1420 },
      { id: 'curio-board', kind: 'board', x: 1700, y: 400, panel: 'curio-board', label: 'Learning board', reach: 'floor', opts: { seed: 5 } },
      { id: 'door-curio-dream', kind: 'door', x: 2110, door: { to: 'dream', spawn: 200 }, label: 'Dream Space', opts: { color: C.night, plaque: '04' } },
    ],
  },
  {
    id: 'dream',
    num: '04',
    name: 'Dream Space',
    // DIGITAL_ME.md stops at this room's heading; its purpose is not defined yet.
    purpose: 'Still being imagined',
    intro: 'The Dream Space. Try the clouds — they hold you up.',
    width: 2400,
    seed: 44,
    sky: { colors: ['#2a2440', '#3b3352', '#7d6aa6', '#d9a7c0'], cloud: 'rgba(217,205,236,0.55)', stars: true, hills: ['#5b4d7e', '#493e69'] },
    paint: { open: true, floor: '#e6dcf3', floorHi: '#f4eefc' },
    spawn: 200,
    objects: [
      { id: 'door-dream-curio', kind: 'door', x: 90, door: { to: 'curiosity', spawn: 1980 }, label: 'Curiosity Corner', opts: { color: C.mintDeep, plaque: '03' } },
      { id: 'dream-stars', kind: 'easel', x: 470, panel: 'dream-stars', label: 'Star map' },
      { id: 'cloud-1', kind: 'cloudPlatform', x: 820, y: 530, platform: { w: 150, top: 30 } },
      { id: 'cloud-2', kind: 'cloudPlatform', x: 1060, y: 430, platform: { w: 150, top: 30 } },
      { id: 'cloud-3', kind: 'cloudPlatform', x: 1300, y: 330, platform: { w: 150, top: 30 } },
      { id: 'dream-moon', kind: 'moon', x: 1500, y: 280, panel: 'dream-moon', label: 'The moon', reach: 'near', range: 170 },
      { id: 'dream-planes', kind: 'mobile', x: 1840, y: 330, panel: 'dream-planes', label: 'Paper planes', reach: 'floor' },
      { id: 'door-dream-memory', kind: 'door', x: 2310, door: { to: 'memory', spawn: 200 }, label: 'Memory Wall', opts: { color: C.peachDeep, plaque: '05' } },
    ],
  },
  {
    id: 'memory',
    num: '05',
    name: 'Memory Wall',
    // Not described in DIGITAL_ME.md yet; frames wait for real memories.
    purpose: 'Still being collected',
    intro: 'The Memory Wall. These frames are waiting for their stories.',
    width: 2200,
    seed: 55,
    sky: { colors: ['#f6cdb6', '#f7dcc6', '#fbefd9'], cloud: '#fff6ec', sun: [900, 220], hills: ['#e7c3ab', '#d9ae95'] },
    paint: { wallTop: '#f7e4d3', wall: '#f2d6c0', motif: 'rgba(255,255,255,0.4)', pattern: 'stripes', wainscot: '#e3cfb4', wainscotLine: 'rgba(90,61,49,0.2)', trim: C.cream, ...wood },
    windows: [{ x: 1960, y: 130, w: 240, h: 230 }],
    rugs: [[1100, 640, C.pink, C.pinkSoft]],
    spawn: 200,
    objects: [
      { id: 'door-memory-dream', kind: 'door', x: 90, door: { to: 'dream', spawn: 2180 }, label: 'Dream Space', opts: { color: C.night, plaque: '04' } },
      { id: 'memory-frames', kind: 'frames', x: 520, y: 380, panel: 'memory-frames', label: 'Framed moments', reach: 'floor' },
      { id: 'bench', kind: 'bench', x: 880, platform: { w: 230, top: 0 } },
      { id: 'memory-polaroids', kind: 'polaroids', x: 1200, y: 260, panel: 'memory-polaroids', label: 'Polaroid string', reach: 'floor' },
      { id: 'memory-board', kind: 'board', x: 1560, y: 400, panel: 'memory-board', label: 'Pin board', reach: 'floor', opts: { seed: 21, surface: '#e9d3c0' } },
      { id: 'window-m', kind: 'window', x: 1960, y: 130 + 230, opts: { curtain: C.peach } },
      { id: 'plant-m', kind: 'plant', x: 1800 },
      { id: 'door-memory-home', kind: 'door', x: 2110, door: { to: 'my-room', spawn: 200 }, label: 'Back to My Room', opts: { color: C.pinkDeep, plaque: '01' } },
    ],
  },
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]));

/** Every object a visitor can open (used for the discovery counter). */
export const DISCOVERABLES = ROOMS.flatMap((r) => r.objects.filter((o) => o.panel).map((o) => o.id));
