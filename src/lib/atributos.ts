/** Sigla em português de cada atributo (o back-end guarda as chaves em inglês). */
export const ATTR_SHORT: Record<string, string> = {
  strength: 'FOR', agility: 'AGI', intelligence: 'INT', resistance: 'RES',
  flow: 'FLX', wisdom: 'SAB', presence: 'PRE', defense: 'DEF',
};

export const siglaAtributo = (attr: string) => ATTR_SHORT[attr] ?? attr.slice(0, 3).toUpperCase();
