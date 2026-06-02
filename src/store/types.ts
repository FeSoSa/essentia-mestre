export type SectionId = 'mesa' | 'imagens' | 'jogadores' | 'inventario' | 'itens' | 'essencias' | 'bestiario' | 'habilidades' | 'classes' | 'racas' | 'log';

export interface Race {
  id: string;
  name: string;
  starterAttributes: PlayerAttributes;
}

/* ── Backend models ─────────────────────────────────────────── */

export interface Vital { current: number; max: number; }

export interface CharInfo {
  name: string; skillClass: string; subClass?: string;
  race: string; level: number;
  slotsClass: number; slotsFree: number; slotsTotal: number;
  portraitUrl?: string;
}

export interface PlayerAttributes {
  strength: number; agility: number; intelligence: number;
  resistance: number; flow: number; wisdom: number;
  presence: number; defense: number;
}

export interface Slot {
  id: string; type: 'class' | 'free' | 'human_bonus';
  skillId?: string; cooldownRemaining: number;
  toggleActive?: boolean;
}

export interface Dice { quantity: number; die: string; }

export interface AutoEffect {
  trigger: string; type: string;
  value?: number; percentual?: number;
  attribute?: string; dice?: Dice;
}

export interface OnExpireEffect {
  name: string; desc: string;
  durationTurns: number;
  icon?: string; color?: string;
  instantHealHp?: number;
  instantHealFlow?: number;
  instantDamageHp?: number;
  attributeBonus?: Record<string, number>;
  effects?: AutoEffect[];
  hitBonus?: number;
  attackBonus?: number;
  damageBonus?: number;
}

export interface StatusEffect {
  id: string; name: string; desc: string; icon?: string; color?: string;
  durationTurns: number; effects: AutoEffect[];
  attributeBonus?: Record<string, number>;
  hitBonus?: number;
  attackBonus?: number;
  damageBonus?: number;
  onExpire?: OnExpireEffect;
}

export interface OnUseEffect {
  name: string; desc: string;
  durationTurns: number; // -1 = permanente
  icon?: string; color?: string;
  instantHealHp?: number;
  instantHealFlow?: number;
  attributeBonus?: Record<string, number>;
  effects?: AutoEffect[];
  hitBonus?: number;
  attackBonus?: number;
  damageBonus?: number;
  onExpire?: OnExpireEffect;
}

export interface Item {
  id: string; name: string; desc: string; qty: number; type: string; icon?: string;
  // Weapon fields (type === 'weapon')
  weaponType?: string; damageBase?: number; damageAttribute?: string;
  equilibrio?: number; properties?: string;
  // Armor field
  damageReduction?: number;
  armorWeight?: string; // "leve" | "média" | "pesada"
  // Shared equip fields (weapon | armor | accessory)
  attributeBonus?: Record<string, number>;
  equipSlot?: string; // 'mainHand'|'offHand'|'armor'|'amulet'|'ring'|'utility'
  rarity?: string;
  onUseEffect?: OnUseEffect;
}

export interface WeaponEquip {
  id: string; name: string; weaponType: string;
  damageBase: number; damageAttribute: string; equilibrio?: number;
  attributeBonus?: Record<string, number>;
  rarity?: string;
}
export interface ArmorEquip {
  id: string; name: string; damageReduction: number;
  attributeBonus?: Record<string, number>;
  armorWeight?: string;
  rarity?: string;
}
export interface AccessoryEquip {
  id: string; name: string; attributeBonus?: Record<string, number>;
  rarity?: string;
}
export interface Equipment {
  mainHand?: WeaponEquip; offHand?: WeaponEquip;
  armor?: ArmorEquip; amulet?: AccessoryEquip;
  ring?: AccessoryEquip; utility?: AccessoryEquip;
}

export interface PendingRequest {
  id: string; type: string; itemId: string; timestamp: string;
}

export interface Essencia {
  id: string; name: string; type: string; desc: string;
  attributeBonus: Record<string, number>; skillIds: string[];
  icon?: string; color?: string; parentId?: string;
}

export interface EssenciaObtida {
  essenciaId: string; attributeBonusActive: boolean; unlockedSkillIds: string[];
}

export interface Player {
  id: string; code: string; char: CharInfo;
  hp: Vital; flow: Vital;
  ether: Vital & { unlocked: boolean };
  exp: { available: number; total: number };
  attributes: PlayerAttributes;
  effectiveAttributes?: PlayerAttributes;
  slots: Slot[]; equipment: Equipment;
  statusEffects: StatusEffect[];
  items: Item[];
  pendingRequests?: PendingRequest[];
  essenciasObtidas?: EssenciaObtida[];
  gold: number;
  sobrecargaDesbloqueada?: boolean;
  sobrecargaAtiva?: boolean;
  sobrecargaNivel?: number;
  desviosRestantes?: number;
  customBars?: CustomBar[];
}

export interface CustomBar {
  id: string; name: string; color: string; current: number; max: number;
}

export interface DamageApprovalRequest {
  requestId: string;
  playerId: string;
  playerName: string;
  targetId: string;
  targetType: 'enemy' | 'boss';
  targetName: string;
  damage: number;
  costs?: Record<string, number>;
  onHitEffects?: import('@/store/effectPresetsStore').EffectPreset[];
}

export interface SobrecargaRequest {
  playerId: string;
  playerName: string;
  nivel: number;
  cd: number;
  sabMod: number;
}

export interface InitiativeEntry { playerId: string; name: string; value: number; }

export interface LogEntry {
  playerId: string; text: string; time: string; timestamp: string;
  type?: string;
}

export interface ImageEntry {
  id: string; url: string; title: string; timestamp: string; active: boolean;
}

export interface FastActionOption { id: string; text: string; color: string; }

export interface FastAction {
  active: boolean; title: string; lockOnePerPlayer: boolean;
  lockedPlayers: string[]; options: FastActionOption[];
  answers: Record<string, string>;
}

export interface ClassPerks {
  hasPressureBar: boolean;
  unarmedAttack?: { damageBase: number; attribute: string };
}

export interface ClassKit {
  id: string; skillClass: string;
  starterAttributes: PlayerAttributes;
  starterEquipment: unknown; starterItems: Item[];
  starterSlots: Slot[]; starterSkillIds: string[];
  allowedWeaponTypes?: string[];
  perks: ClassPerks;
}

export interface Maestria {
  level: number; totalUses: number; nextLevelUses: number;
  upgrades: unknown[];
  computed: {
    damageFixedBonus: number; esBonus: number;
    costReduction: number; cooldownReduction: number; canUseTwice: boolean;
  };
}

export interface PlayerSkill {
  id: string; playerId: string; skillId: string;
  used: boolean; equipped: boolean; slotId?: string;
  maestria: Maestria;
}

export interface SkillTreeEntry {
  skill: { id: string; name: string; desc: string; type: string; cooldownTurns: number; };
  playerSkill?: PlayerSkill;
  status: 'UNLOCKED' | 'AVAILABLE' | 'LOCKED';
}

export interface ItemRequirements {
  level?: number;
  attributes?: Record<string, number>;
}

export interface ItemCatalog {
  id: string; name: string; desc: string; type: string; icon?: string;
  weaponType?: string; damageBase?: number; damageAttribute?: string;
  equilibrio?: number; properties?: string;
  damageReduction?: number; armorWeight?: string;
  attributeBonus?: Record<string, number>; equipSlot?: string;
  rarity?: string; twoHanded?: boolean;
  requirements?: ItemRequirements;
  onUseEffect?: OnUseEffect;
}

export interface EnemyAttributes { strength: number; agility: number; intelligence: number; defense: number; }
export interface EnemyAttack {
  name: string;
  damage: string;
  damageBase?: number;
  damageAttribute?: string;
  equilibrio?: number;
  skillId?: string;
  skillName?: string;
}

export type GoldDropTier = 'pobre' | 'comum' | 'rico' | 'tesouro';
export interface GoldDrop { tier: GoldDropTier; min: number; max: number; }

export interface EnemyDrop {
  name: string; icon: string;
  itemId?: string;
  targetPlayerId?: string;
  goldDrop?: GoldDrop;
}

export interface BossAbility { name: string; desc: string; cooldownTurns: number; }
export interface BossImmunity {
  type: string;
  icon: string;
  kind: 'total' | 'partial';
  sources?: string[];
  isFlag?: boolean;
}
export interface BossResistance { type: string; reduction: number; }
export interface BossReward { type: string; referenceId: string; name: string; desc: string; }

export interface BossAttributes {
  strength: number; agility: number; intelligence: number; resistance: number;
  flow: number; wisdom: number; presence: number; defense: number;
}

export interface BossPhase {
  phaseNumber: number; name: string; hpMax: number;
  attributes: BossAttributes; attacks: EnemyAttack[]; specialAbility?: BossAbility;
}

export interface BossTemplate {
  id: string; name: string; type: string; icon: string; imageUrl?: string;
  phases: BossPhase[]; immunities: BossImmunity[]; resistances: BossResistance[];
  drops: EnemyDrop[]; xp: number; specialReward?: BossReward; notes: string;
}

export interface BossInstance {
  instanceId: string; templateId?: string;
  name: string; icon: string; imageUrl?: string;
  phases: BossPhase[]; currentPhase: number; hpCurrent: number;
  immunities: BossImmunity[]; resistances: BossResistance[];
  drops: EnemyDrop[]; xp: number; specialReward?: BossReward; notes: string;
  statusEffects?: StatusEffect[];
}

export interface AllyAttributes { strength: number; agility: number; intelligence: number; defense: number; }
export interface AllyAttack {
  name: string; damage: string;
  damageBase?: number; damageAttribute?: string; equilibrio?: number;
  skillId?: string; skillName?: string;
}

export interface AllyTemplate {
  id: string; name: string; type: string;
  hpMax: number; portraitUrl?: string;
  attributes: AllyAttributes; attacks: AllyAttack[];
  immunities?: BossImmunity[];
  desc: string; notes: string;
}

export interface CombatAlly {
  id: string; templateId?: string; name: string; type: string;
  hpCurrent: number; hpMax: number; portraitUrl?: string;
  attributes: AllyAttributes; attacks: AllyAttack[];
  immunities?: BossImmunity[];
  statusEffects?: StatusEffect[];
  desc: string; notes: string;
}

export interface EnemyTemplate {
  id: string; name: string; type: string; icon: string; imageUrl?: string;
  hpMax: number; attributes: EnemyAttributes;
  attacks: EnemyAttack[]; drops: EnemyDrop[];
  immunities?: BossImmunity[];
  xp: number; desc: string; notes: string;
}

export interface EnemyInstance {
  instanceId: string; templateId?: string;
  name: string; type: string; icon: string; imageUrl?: string;
  hpCurrent: number; hpMax: number;
  attributes: EnemyAttributes;
  attacks: EnemyAttack[]; drops: EnemyDrop[];
  immunities?: BossImmunity[];
  statusEffects?: StatusEffect[];
  xp: number; desc: string; notes: string;
}
