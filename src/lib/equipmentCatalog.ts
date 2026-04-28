import type { WeaponEquip, ArmorEquip, AccessoryEquip } from '@/store/types';

export type EquipSlot = 'mainHand' | 'offHand' | 'armor' | 'amulet' | 'ring' | 'utility';

export interface CatalogWeapon    { slot: 'mainHand' | 'offHand'; item: WeaponEquip; }
export interface CatalogArmor     { slot: 'armor';                 item: ArmorEquip; }
export interface CatalogAccessory { slot: 'amulet' | 'ring' | 'utility'; item: AccessoryEquip; }
export type CatalogEntry = CatalogWeapon | CatalogArmor | CatalogAccessory;

export const EQUIPMENT_CATALOG: CatalogEntry[] = [
  // Armas — mão principal
  { slot: 'mainHand', item: { id: 'espada-curta',   name: 'Espada Curta',   weaponType: 'sword',  damageBase: 3, damageDice: { quantity: 1, die: 'd6' }, damageAttribute: 'strength' } },
  { slot: 'mainHand', item: { id: 'espada-longa',   name: 'Espada Longa',   weaponType: 'sword',  damageBase: 4, damageDice: { quantity: 1, die: 'd8' }, damageAttribute: 'strength' } },
  { slot: 'mainHand', item: { id: 'adaga',           name: 'Adaga',          weaponType: 'dagger', damageBase: 1, damageDice: { quantity: 1, die: 'd4' }, damageAttribute: 'agility'  } },
  { slot: 'mainHand', item: { id: 'machado',         name: 'Machado',        weaponType: 'axe',    damageBase: 4, damageDice: { quantity: 1, die: 'd6' }, damageAttribute: 'strength' } },
  { slot: 'mainHand', item: { id: 'lanca',           name: 'Lança',          weaponType: 'spear',  damageBase: 3, damageDice: { quantity: 1, die: 'd8' }, damageAttribute: 'strength' } },
  { slot: 'mainHand', item: { id: 'cajado-arcano',   name: 'Cajado Arcano',  weaponType: 'staff',  damageBase: 2, damageDice: { quantity: 1, die: 'd8' }, damageAttribute: 'intelligence' } },
  { slot: 'mainHand', item: { id: 'arco-curto',      name: 'Arco Curto',     weaponType: 'bow',    damageBase: 2, damageDice: { quantity: 1, die: 'd6' }, damageAttribute: 'agility'  } },
  { slot: 'mainHand', item: { id: 'arco-longo',      name: 'Arco Longo',     weaponType: 'bow',    damageBase: 2, damageDice: { quantity: 1, die: 'd8' }, damageAttribute: 'agility'  } },
  { slot: 'mainHand', item: { id: 'besta',           name: 'Besta',          weaponType: 'bow',    damageBase: 3, damageDice: { quantity: 1, die: 'd8' }, damageAttribute: 'agility'  } },
  // Armas — mão secundária / offhand
  { slot: 'offHand', item: { id: 'adaga-off',        name: 'Adaga (off)',    weaponType: 'dagger', damageBase: 1, damageDice: { quantity: 1, die: 'd4' }, damageAttribute: 'agility'  } },
  { slot: 'offHand', item: { id: 'escudo-leve',      name: 'Escudo Leve',    weaponType: 'shield', damageBase: 0, damageDice: { quantity: 1, die: 'd4' }, damageAttribute: 'strength', attributeBonus: { defense: 1 } } },
  { slot: 'offHand', item: { id: 'escudo-pesado',    name: 'Escudo Pesado',  weaponType: 'shield', damageBase: 0, damageDice: { quantity: 1, die: 'd4' }, damageAttribute: 'strength', attributeBonus: { defense: 3 } } },
  // Armaduras
  { slot: 'armor', item: { id: 'roupa-comum',        name: 'Roupa Comum',    damageReduction: 0 } },
  { slot: 'armor', item: { id: 'armadura-couro',     name: 'Armadura de Couro', damageReduction: 2 } },
  { slot: 'armor', item: { id: 'cota-malha',         name: 'Cota de Malha',  damageReduction: 4 } },
  { slot: 'armor', item: { id: 'armadura-placas',    name: 'Armadura de Placas', damageReduction: 6 } },
  { slot: 'armor', item: { id: 'vestes-arcanistas',  name: 'Vestes Arcanistas', damageReduction: 1, attributeBonus: { intelligence: 1 } } },
  // Amuletos
  { slot: 'amulet', item: { id: 'amuleto-forca',     name: 'Amuleto de Força',       attributeBonus: { strength: 1 } } },
  { slot: 'amulet', item: { id: 'amuleto-agilidade', name: 'Amuleto de Agilidade',   attributeBonus: { agility: 1 } } },
  { slot: 'amulet', item: { id: 'amuleto-arcano',    name: 'Amuleto Arcano',         attributeBonus: { intelligence: 1 } } },
  { slot: 'amulet', item: { id: 'amuleto-vida',      name: 'Amuleto da Vida',        attributeBonus: { resistance: 1 } } },
  // Anéis
  { slot: 'ring', item: { id: 'anel-presenca',       name: 'Anel de Presença',       attributeBonus: { presence: 1 } } },
  { slot: 'ring', item: { id: 'anel-sabedoria',      name: 'Anel de Sabedoria',      attributeBonus: { wisdom: 1 } } },
  { slot: 'ring', item: { id: 'anel-flow',           name: 'Anel de Fluxo',          attributeBonus: { flow: 1 } } },
  // Utilidade
  { slot: 'utility', item: { id: 'grimorio',         name: 'Grimório',               attributeBonus: { intelligence: 1 } } },
  { slot: 'utility', item: { id: 'bolsa-componentes', name: 'Bolsa de Componentes',  attributeBonus: {} } },
];
