export type SectionId = 'mesa' | 'mapa' | 'imagens' | 'jogadores' | 'inventario' | 'itens' | 'essencias' | 'bestiario' | 'habilidades' | 'classes' | 'racas' | 'log' | 'loja' | 'mundo' | 'tiposDano';

export interface Race {
  id: string;
  name: string;
  starterAttributes: PlayerAttributes;
  inventorySize?: number;
  tracosDano?: TracoDano[];
  deslocamento?: number;          // casas por turno no tabuleiro da Mesa (padrão 6)
}

export type { TracoDano, DegrauAplicado } from '@/lib/tiposDano';
import type { TracoDano, DegrauAplicado } from '@/lib/tiposDano';

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
  id: string; type: 'class' | 'free' | 'human_bonus' | 'passive';   // passive: só passiva, e só ali ela vale
  skillId?: string; cooldownRemaining: number;
  toggleActive?: boolean;
}

export interface Dice { quantity: number; die: string; }

export interface AutoEffect {
  trigger: string; type: string;
  value?: number; percentual?: number;
  attribute?: string; dice?: Dice;
  costType?: string;
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
  id: string; catalogId?: string; name: string; desc: string; qty: number; type: string; icon?: string;
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
  margemCritico?: number;
  negaCritico?: boolean;
  twoHanded?: boolean;
}

export interface WeaponEquip {
  id: string; name: string; weaponType: string;
  damageBase: number; damageAttribute: string; equilibrio?: number;
  attributeBonus?: Record<string, number>;
  rarity?: string;
  margemCritico?: number;
  catalogId?: string; tiposDano?: string[];
}
export interface ArmorEquip {
  id: string; name: string; damageReduction: number;
  attributeBonus?: Record<string, number>;
  armorWeight?: string;
  rarity?: string;
  negaCritico?: boolean;
  catalogId?: string; tracosDano?: TracoDano[];
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
  nivelMaeNecessario?: number | null;   // Derivada: liberada pela mãe com ela neste nível (vazio = só tendo a Derivada)
  bonusPorNivel?: Record<string, number>[]; // quanto cada nível (1 a 4) soma ao bônus; vazio = regra padrão de %
}

export interface EssenciaObtida {
  essenciaId: string; attributeBonusActive: boolean; unlockedSkillIds: string[];
  nivel?: number;   // 1 a 4
}

/** Capacidade de Essência e penalidade por excedente (calculado pela API). */
export interface EstadoEssencia {
  capacidade: number; uso: number; excedente: number;
  penalidadeRes: number; penalidadeFlx: number; testeSabDescanso: boolean;
}

export type EfeitoAlvo = 'SELF' | 'ALVO' | 'ALIADOS' | 'AREA';
export type EfeitoTipo = 'MODIFICADOR' | 'CONDICAO' | 'ESCUDO' | 'CURA';

/** Efeito de skill: lista única que substitui buff, passivo, bônus de combate e efeitos no usuário/alvo. */
export interface Efeito {
  alvo: EfeitoAlvo;
  tipo: EfeitoTipo;
  stat?: string;              // FOR AGI INT RES FLX SAB PRE DEF ACERTO DANO
  valor?: number;
  condicao?: string;          // nome de uma condição cadastrada
  // ESCUDO: valor = PV temporário por cima da vida (sem duração; zera no fim do dia)
  // CURA: valor de PV; sem duração é instantânea, com duração cura esse valor a cada turno (nunca gera Escudo)
  duracao?: number | 'PASSIVO';
}

export interface TierRegra { tier: number; equilibrio: number; custoBase: number; }

export interface Perfil {
  historia: string;
  tracos: string[];
  idade: string;
  altura: string;
  origem: string;
  faccao: string;
  anotacoes: string;
}

export interface Player {
  id: string; code: string; char: CharInfo;
  hp: Vital; flow: Vital;
  ether: Vital & { unlocked: boolean };
  pressao?: Vital;
  exp: { available: number; total: number };
  attributes: PlayerAttributes;
  effectiveAttributes?: PlayerAttributes;
  slots: Slot[]; equipment: Equipment;
  statusEffects: StatusEffect[];
  items: Item[];
  pendingRequests?: PendingRequest[];
  essenciasObtidas?: EssenciaObtida[];
  essencia?: EstadoEssencia | null;
  escudo?: number;                // PV temporário por cima da vida (teto 25% do PV máx, zera no fim do dia)
  proficiencias?: string[];
  maestrias?: MaestriaGrupo[];
  nivelClasse?: number;           // 1 a 4, requisito das skills de classe pelo tier
  gold: number;
  sobrecargaDesbloqueada?: boolean;
  sobrecargaAtiva?: boolean;
  sobrecargaNivel?: number;
  desviosRestantes?: number;
  sorte?: number;                 // d6 de sorte da campanha inteira; não volta, só o mestre concede
  customBars?: CustomBar[];
  inventorySize?: number;
  perfil?: Perfil;                // aba Personagem: história e traços (mestre) + anotações (jogador)
  active?: boolean;
}

export interface CustomBar {
  id: string; name: string; color: string; current: number; max: number;
}

export interface DamageApprovalRequest {
  requestId: string;
  playerId: string;
  playerName: string;
  targetId: string;
  targetType: 'enemy' | 'boss' | 'player' | 'ally';
  targetName: string;
  damage: number;
  costs?: Record<string, number>;
  onHitEffects?: import('@/store/effectPresetsStore').EffectPreset[];
  slotId?: string;
  skillId?: string;
  critico?: boolean;
  danoSemCritico?: number;
  ataqueBasico?: boolean;
  /** Prévia da fraqueza/resistência do alvo; o servidor recalcula ao aprovar. */
  degrau?: DegrauAplicado | null;
}

/** Skill usada em aliados: o jogador escolheu quem recebe; o mestre aprova. */
export interface AllyEffectApprovalRequest {
  requestId: string;
  playerId: string;
  playerName: string;
  skillId: string;
  skillName: string;
  slotId: string;
  alvos: { id: string; nome: string; hp: number; hpMax: number; escudo: number; portraitUrl?: string | null }[];
  cura: number;      // cura na hora em cada aliado
  escudo: number;    // Escudo em cada aliado
  efeitos: StatusEffect[];
  costs: Record<string, number>;
}

export interface EffectApprovalRequest {
  requestId: string;
  playerId: string;
  playerName: string;
  targets: Array<{ targetId: string; targetType: 'enemy' | 'boss' | 'player' | 'ally'; targetName: string }>;
  onHitEffects: import('@/store/effectPresetsStore').EffectPreset[];
  skillId?: string;
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

export interface Note {
  id: string; text: string; color: string; timestamp: string;
}

export interface ImageEntry {
  id: string; url: string; title: string; timestamp: string; active: boolean;
}

export interface DocumentEntry {
  id: string; url: string; title: string; timestamp: string; active: boolean;
}

export interface MapMarker {
  id: string; mapId: string; x: number; y: number;
  label: string; regionId: string; description?: string; visible: boolean;
}

export interface Region {
  id: string; name: string; url: string; description?: string;
}

export interface FastActionOption { id: string; text: string; color: string; }

export interface FastAction {
  active: boolean; title: string; lockOnePerPlayer: boolean;
  lockedPlayers: string[]; options: FastActionOption[];
  answers: Record<string, string>;
}

export interface FastActionTemplate {
  id: string; name: string; title: string; options: FastActionOption[];
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
  proficienciasIniciais?: string[];
  pvPorNivel?: number;      // PV máximo a mais por nível acima do 1
  fluxoPorNivel?: number;   // Fluxo máximo a mais por nível acima do 1
  perks: ClassPerks;
}

/** Maestria de um grupo no personagem: categoria de arma ("espadas") ou Essência (essenciaId). */
export interface MaestriaGrupo {
  grupo: string;
  tipoGrupo: 'ARMA' | 'ESSENCIA';
  nivel: number;          // 1 a 4
  usos: number;
  ultimoCombateUso?: string | null;
  usosNoCombate?: number;
}

/** Visão calculada pela API de uma maestria de grupo. */
export interface MaestriaGrupoInfo {
  grupo: string;
  tipoGrupo: 'ARMA' | 'ESSENCIA';
  nome: string;
  nivel: number;
  nivelMax: number;
  usos: number;
  proximoNivelUsos: number | null;
  disponivel: boolean;    // usos já bastam para o próximo nível: aguardando o mestre confirmar
  danoPct: number;
  custoPct: number;
  ativa: boolean;         // arma sem proficiência: não conta nem dá bônus
  sobePorUso: boolean;    // Essência Elemental: não conta uso, o mestre define o nível
}

/** Um nível da tabela de maestria (valores totais no nível). */
export interface NivelMaestriaGrupo { nivel: number; usos: number; danoPct: number; custoPct: number; }

export interface MaestriaConfig {
  niveis: NivelMaestriaGrupo[];
}

export interface CombateConfig {
  critMultBase: number;
  critMultDado: number;
  equilibrioSemProficiencia: number;
  equilibrioComProficiencia: number;
  esPorAcertoBasico: number;
  desviosPorCombate: number;
  tiers: TierRegra[];
}

/** Nível de achado do sorteador: peso de cada raridade (chaves de Rarity). */
export interface NivelAchado { id: string; nome: string; pesos: Record<string, number>; }
export interface AchadoConfig {
  niveis: NivelAchado[];
  pesosTipo: Record<string, number>;
  /** Com uma região escolhida: quantas vezes um item da região pesa mais que um comum. */
  pesoRegional?: number;
}

/** Dificuldade do gerador de encontros: perigo = % do PV do grupo perdido em média (simulado). */
export interface DificuldadeEncontro { id: string; nome: string; perigo: number; }
export interface EncontroConfig { dificuldades: DificuldadeEncontro[]; hordaMax: number; }

export interface PlayerSkill {
  id: string; playerId: string; skillId: string;
  used: boolean; equipped: boolean; slotId?: string;
  blocked?: boolean;
}

export interface SkillTreeEntry {
  skill: { id: string; name: string; desc: string; type: string; cooldownTurns: number; ultimate?: boolean; tier?: number | null; };
  playerSkill?: PlayerSkill;
  maestria?: MaestriaGrupoInfo;   // maestria do grupo da skill
  bloqueio?: string | null;       // requisito por origem/tier que falta
  status: 'UNLOCKED' | 'AVAILABLE' | 'LOCKED';
}

export interface ItemRequirements {
  level?: number;
  attributes?: Record<string, number>;
}

export interface ItemCatalog {
  id: string; name: string; desc: string; type: string; icon?: string;
  weaponType?: string; damageBase?: number; damageAttribute?: string;
  equilibrio?: number; properties?: string; margemCritico?: number; negaCritico?: boolean;
  damageReduction?: number; armorWeight?: string;
  attributeBonus?: Record<string, number>; equipSlot?: string;
  rarity?: string; twoHanded?: boolean;
  requirements?: ItemRequirements;
  requisitoNarrativo?: string;   // só informativo (armas lendárias/históricas)
  onUseEffect?: OnUseEffect;
  goldValue?: number;
  subtype?: 'consumivel' | 'drop' | 'chave' | 'misc';
  regioes?: string[];            // nomes de região do mundo (não as regiões do Mapa); vazio = comum (sai em qualquer lugar)
  unico?: boolean;               // item com história: só sai pela mão do mestre ou drop fixo, nunca no sorteio
  tiposDano?: string[];          // arma: 1 a 2 tipos de dano
  tracosDano?: TracoDano[];      // armadura de corpo: fraquezas, resistências e imunidades
}

export interface ShopItem { itemId: string; stockLimit?: number; }
export interface Shop { id: string; name: string; items: ShopItem[]; active: boolean; }

export interface EnemyAttributes { strength: number; agility: number; intelligence: number; defense: number; }
export interface EnemyAttack {
  name: string;
  damage: string;
  damageBase?: number;
  damageAttribute?: string;
  equilibrio?: number;
  skillId?: string;
  skillName?: string;
  custoEs?: number;
  tiposDano?: string[];
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
  defesa?: number; modAcerto?: number; esMax?: number;
}

export interface BossTemplate {
  id: string; name: string; type: string; icon: string; imageUrl?: string;
  phases: BossPhase[]; immunities: BossImmunity[]; resistances: BossResistance[];
  drops: EnemyDrop[]; xp: number; specialReward?: BossReward; notes: string;
  negaCritico?: boolean;
  tracosDano?: TracoDano[];
}

export interface BossInstance {
  instanceId: string; templateId?: string;
  name: string; icon: string; imageUrl?: string;
  phases: BossPhase[]; currentPhase: number; hpCurrent: number;
  immunities: BossImmunity[]; resistances: BossResistance[];
  drops: EnemyDrop[]; xp: number; specialReward?: BossReward; notes: string;
  statusEffects?: StatusEffect[];
  esCurrent?: number | null; negaCritico?: boolean; negaCriticoRodada?: number | null;
  tracosDano?: TracoDano[];
}

export interface AllyAttributes { strength: number; agility: number; intelligence: number; defense: number; }
export interface AllyAttack {
  name: string; damage: string;
  damageBase?: number; damageAttribute?: string; equilibrio?: number;
  skillId?: string; skillName?: string;
  tiposDano?: string[];
}

export interface AllyTemplate {
  id: string; name: string; type: string;
  hpMax: number; portraitUrl?: string;
  attributes: AllyAttributes; attacks: AllyAttack[];
  immunities?: BossImmunity[];
  tracosDano?: TracoDano[];
  desc: string; notes: string;
}

export interface CombatAlly {
  id: string; templateId?: string; name: string; type: string;
  hpCurrent: number; hpMax: number; portraitUrl?: string;
  attributes: AllyAttributes; attacks: AllyAttack[];
  immunities?: BossImmunity[];
  tracosDano?: TracoDano[];
  statusEffects?: StatusEffect[];
  desc: string; notes: string;
}

export interface EnemyTemplate {
  id: string; name: string; type: string; icon: string; imageUrl?: string;
  hpMax: number; attributes: EnemyAttributes;
  attacks: EnemyAttack[]; drops: EnemyDrop[];
  immunities?: BossImmunity[];
  xp: number; desc: string; notes: string;
  defesa?: number; modAcerto?: number; esMax?: number; negaCritico?: boolean;
  /** Declarada pelo mestre (facil, medio, dificil, mortal): o gerador de encontros respeita. */
  dificuldade?: string;
  tracosDano?: TracoDano[];
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
  defesa?: number; modAcerto?: number; esMax?: number; esCurrent?: number | null;
  negaCritico?: boolean; negaCriticoRodada?: number | null;
  tracosDano?: TracoDano[];
}

/** Ação proposta no turno automático de um inimigo ou aliado. */
export interface EnemyAction {
  id: string; combatId?: string; rodada: number;
  status: 'PROPOSTA' | 'AGUARDANDO_JOGADOR' | 'CONCLUIDA' | 'PULADA' | 'ERROU';
  entityId: string; entityKind: 'enemy' | 'boss' | 'ally'; entityName: string;
  /** player quando um inimigo ataca; enemy/boss quando um aliado ataca */
  alvoId: string; alvoKind?: 'player' | 'enemy' | 'boss'; alvoNome: string;
  ataqueIdx: number; ataqueNome: string; formula: string;
  d20Acerto: number; modAcerto: number; totalAcerto: number; defAlvo: number; acertou: boolean;
  d20Dano?: number | null; dano?: number | null; custoEs: number;
  desviou?: boolean | null; desvioRoll?: number | null; desvioTotal?: number | null;
  danoAplicado?: number | null; decisaoMestre?: string | null; trocas: number;
  tiposDano?: string[];
  /** Inimigo errou um jogador com skill de contra-ataque: nome da skill; contraAtaque = LIBERADO | IGNORADO (vazio = aguardando). */
  contraAtaqueSkill?: string | null;
  contraAtaque?: string | null;
  /** Fraqueza/resistência do alvo (prévia na proposta, definitiva quando o golpe entra). */
  degrau?: DegrauAplicado | null;
}
