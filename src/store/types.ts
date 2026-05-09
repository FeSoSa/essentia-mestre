export type SectionId = 'mesa' | 'imagens' | 'jogadores' | 'inventario' | 'itens' | 'essencias' | 'bestiario' | 'habilidades' | 'classes' | 'log';

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
}

export interface Dice { quantity: number; die: string; }

export interface AutoEffect {
  trigger: string; type: string;
  value?: number; percentual?: number;
  attribute?: string; dice?: Dice;
}

export interface StatusEffect {
  id: string; name: string; desc: string; icon?: string; color?: string;
  durationTurns: number; effects: AutoEffect[];
}

export interface Item {
  id: string; name: string; desc: string; qty: number; type: string; icon?: string;
  // Weapon fields (type === 'weapon')
  weaponType?: string; damageBase?: number; damageDice?: Dice;
  damageAttribute?: string; properties?: string;
  // Armor field
  damageReduction?: number;
  armorWeight?: string; // "leve" | "média" | "pesada"
  // Shared equip fields (weapon | armor | accessory)
  attributeBonus?: Record<string, number>;
  equipSlot?: string; // 'mainHand'|'offHand'|'armor'|'amulet'|'ring'|'utility'
  rarity?: string;
}

export interface WeaponEquip {
  id: string; name: string; weaponType: string;
  damageBase: number; damageDice: Dice; damageAttribute: string;
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
  icon?: string; color?: string;
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
  unarmedDamage?: string;
}

export interface ClassKit {
  id: string; skillClass: string;
  starterAttributes: PlayerAttributes;
  starterEquipment: unknown; starterItems: Item[];
  starterSlots: Slot[]; starterSkillIds: string[];
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

export interface ItemCatalog {
  id: string; name: string; desc: string; type: string; icon?: string;
  weaponType?: string; damageBase?: number; damageDice?: Dice;
  damageAttribute?: string; properties?: string;
  damageReduction?: number; armorWeight?: string;
  attributeBonus?: Record<string, number>; equipSlot?: string;
  rarity?: string; twoHanded?: boolean;
}

export interface EnemyAttributes { strength: number; agility: number; intelligence: number; defense: number; }
export interface EnemyAttack { name: string; damage: string; }
export interface EnemyDrop { name: string; icon: string; }

export interface BossAbility { name: string; desc: string; cooldownTurns: number; }
export interface BossImmunity { type: string; icon: string; }
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
  id: string; name: string; type: string; icon: string;
  phases: BossPhase[]; immunities: BossImmunity[]; resistances: BossResistance[];
  drops: EnemyDrop[]; xp: number; specialReward?: BossReward; notes: string;
}

export interface BossInstance {
  instanceId: string; templateId?: string;
  name: string; icon: string;
  phases: BossPhase[]; currentPhase: number; hpCurrent: number;
  immunities: BossImmunity[]; resistances: BossResistance[];
  drops: EnemyDrop[]; xp: number; specialReward?: BossReward; notes: string;
}

export interface EnemyTemplate {
  id: string; name: string; type: string; icon: string;
  hpMax: number; attributes: EnemyAttributes;
  attacks: EnemyAttack[]; drops: EnemyDrop[];
  xp: number; notes: string;
}

export interface EnemyInstance {
  instanceId: string; templateId?: string;
  name: string; type: string; icon: string;
  hpCurrent: number; hpMax: number;
  attributes: EnemyAttributes;
  attacks: EnemyAttack[]; drops: EnemyDrop[];
  xp: number; notes: string;
}
