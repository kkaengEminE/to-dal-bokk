// ===== CANVAS =====
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

// ===== MAP =====
export const MAP_WIDTH = 1600;
export const MAP_HEIGHT = 1200;
export const TILE_SIZE = 64;
export const WALL_THICKNESS = 32;

// ===== PLAYER =====
export const PLAYER_RADIUS = 16;
export const PLAYER_SPEED = 150;
export const PLAYER_BASE_HP = 2;
export const PLAYER_SPAWN_X = 200;
export const PLAYER_SPAWN_Y = 600;

// Roll
export const ROLL_SPEED = 400;
export const ROLL_DURATION = 0.3;
export const ROLL_STAMINA_COST = 35;

// Backstep
export const BACKSTEP_SPEED = 300;
export const BACKSTEP_DURATION = 0.25;
export const BACKSTEP_STAMINA_COST = 25;

// Stamina
export const STAMINA_MAX = 100;
export const STAMINA_REGEN_RATE = 30;
export const STAMINA_REGEN_DELAY = 0.8;
export const STAMINA_DEPLETED_STAGGER = 0.5;

// Attacks
export const ATTACK_WINDUP = 0.15;
export const ATTACK_ACTIVE = 0.2;
export const ATTACK_RECOVERY = 0.2;
export const HEAVY_SLASH_ARC = Math.PI * 2 / 3;   // 120 degrees
export const HEAVY_SLASH_RANGE = 50;
export const HEAVY_SLASH_DAMAGE = 2;
export const THRUST_LENGTH = 60;
export const THRUST_WIDTH = 20;
export const THRUST_DAMAGE = 3;

// Iframes
export const HIT_IFRAME_DURATION = 0.8;
export const FLINCH_DURATION = 0.3;

// ===== DRAGON =====
export const DRAGON_RADIUS = 40;
export const DRAGON_BASE_HP = 20;
export const DRAGON_SPEED = 80;
export const DRAGON_SPAWN_X = 1200;
export const DRAGON_SPAWN_Y = 600;
export const DRAGON_IDLE_TIME_MIN = 1.0;
export const DRAGON_IDLE_TIME_MAX = 2.0;

// Fire breath
export const FIRE_BREATH_TELEGRAPH = 0.8;
export const FIRE_BREATH_ACTIVE = 1.2;
export const FIRE_BREATH_RECOVERY = 0.6;
export const FIRE_BREATH_RANGE = 250;
export const FIRE_BREATH_SPREAD = Math.PI / 2.5;  // 72 degrees
export const FIRE_BREATH_TRACK_SPEED = 0.35;    // rad/s

// Tail swipe
export const TAIL_SWIPE_TELEGRAPH = 0.5;
export const TAIL_SWIPE_ACTIVE = 0.4;
export const TAIL_SWIPE_RECOVERY = 0.8;
export const TAIL_SWIPE_RANGE = 100;
export const TAIL_SWIPE_ARC = Math.PI * 1.5;    // 270 degrees

// Wing gust
export const WING_GUST_TELEGRAPH = 0.7;
export const WING_GUST_ACTIVE = 0.6;
export const WING_GUST_RECOVERY = 0.5;
export const WING_GUST_RANGE = 320;
export const WING_GUST_SPREAD = Math.PI / 1.5;  // 120 degrees
export const WING_GUST_PUSH_SPEED = 200;

// Special phase
export const SPECIAL_HP_THRESHOLD = 0.25;
export const SPECIAL_STAR_GROW_TIME = 1.0;
export const SPECIAL_RISE_TIME = 1.5;
export const SPECIAL_HOVER_TIME = 5.0;
export const SPECIAL_FIRE_DURATION = 2.0;
export const SPECIAL_CRASH_DELAY = 2.5; // 2s wait + 0.5s descend
export const SPECIAL_CRASH_RADIUS = 70;
export const SPECIAL_STUN_TIME = 2.0;
export const STAR_RADIUS = 90;

// ===== EGGS =====
export const EGG_BASE_COUNT = 8;
export const EGG_RADIUS = 10;
export const EGG_NG_PLUS_INCREMENT = 3;
export const EGG_MIN_DISTANCE = 80;

// ===== NG+ =====
export const NG_PLUS_HP_INCREMENT = 1;
export const NG_PLUS_DRAGON_HP_INCREMENT = 5;
export const NG_PLUS_DRAGON_SPEED_MULT = 0.95;

// ===== CAMERA =====
export const CAMERA_LERP = 0.08;
export const CAMERA_SHAKE_DECAY = 0.9;

// ===== COLORS =====
export const COLOR_GRASS = '#4a7a3a';
export const COLOR_GRASS_ALT = '#3d6b30';
export const COLOR_WALL = '#555555';
export const COLOR_WALL_DARK = '#3a3a3a';
export const COLOR_TOMATO = '#e63946';
export const COLOR_TOMATO_DARK = '#c1121f';
export const COLOR_STEM = '#2d6a4f';
export const COLOR_DRAGON = '#2d5016';
export const COLOR_DRAGON_LIGHT = '#6b8f4a';
export const COLOR_DRAGON_EYE = '#ff8c00';
export const COLOR_EGG = '#fefae0';
export const COLOR_EGG_OUTLINE = '#a0845c';
export const COLOR_FIRE = ['#ff4500', '#ff6600', '#ffaa00', '#ffcc00'];
export const COLOR_WIND = 'rgba(255,255,255,0.5)';
export const COLOR_STAR = '#ffd700';
export const COLOR_HP_PLAYER = '#e63946';
export const COLOR_HP_DRAGON = '#8b0000';
export const COLOR_STAMINA = '#4ea8de';
export const COLOR_STAMINA_EMPTY = '#ff4444';
export const COLOR_DOOR_CLOSED = '#444444';
export const COLOR_DOOR_OPEN = '#ffd700';

// ===== PARTICLES =====
export const MAX_PARTICLES = 500;

// ===== GAME STATES =====
export const STATE_TITLE = 'TITLE';
export const STATE_PLAYING = 'PLAYING';
export const STATE_BOSS_SPECIAL = 'BOSS_SPECIAL';
export const STATE_EGGS_BURNED = 'EGGS_BURNED';
export const STATE_VICTORY = 'VICTORY';
export const STATE_VICTORY_SCREEN = 'VICTORY_SCREEN';
export const STATE_DEATH = 'DEATH';

// ===== PLAYER STATES =====
export const PS_IDLE = 'IDLE';
export const PS_MOVING = 'MOVING';
export const PS_ROLLING = 'ROLLING';
export const PS_BACKSTEPPING = 'BACKSTEPPING';
export const PS_ATTACKING = 'ATTACKING';
export const PS_FLINCHING = 'FLINCHING';
export const PS_STAGGERING = 'STAGGERING';
export const PS_DEAD = 'DEAD';

// ===== DRAGON STATES =====
export const DS_IDLE = 'IDLE';
export const DS_CHASING = 'CHASING';
export const DS_FIRE_BREATH = 'FIRE_BREATH';
export const DS_TAIL_SWIPE = 'TAIL_SWIPE';
export const DS_WING_GUST = 'WING_GUST';
export const DS_SPECIAL_SETUP = 'SPECIAL_SETUP';
export const DS_SPECIAL_RISING = 'SPECIAL_RISING';
export const DS_SPECIAL_HOVERING = 'SPECIAL_HOVERING';
export const DS_SPECIAL_FIRE = 'SPECIAL_FIRE';
export const DS_SPECIAL_CRASH = 'SPECIAL_CRASH';
export const DS_STUNNED = 'STUNNED';
export const DS_DEAD = 'DEAD';

// ===== ATTACK PHASES =====
export const AP_WINDUP = 'WINDUP';
export const AP_ACTIVE = 'ACTIVE';
export const AP_RECOVERY = 'RECOVERY';

// ===== MUTABLE ATTACK CONFIG (for admin sliders) =====
export const attackConfig = {
    fireBreathRange: FIRE_BREATH_RANGE,
    fireBreathSpread: FIRE_BREATH_SPREAD,
    wingGustRange: WING_GUST_RANGE,
    wingGustSpread: WING_GUST_SPREAD,
    tailSwipeRange: TAIL_SWIPE_RANGE,
    tailSwipeArc: TAIL_SWIPE_ARC,
};
