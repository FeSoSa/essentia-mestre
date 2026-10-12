import { BookOpen, Gem, Lock, Swords, User, type LucideIcon } from 'lucide-react';

/** Campo de texto extra que um tipo de ponto mostra no editor (gravado em `extras`). */
export interface CampoExtra { chave: string; rotulo: string; placeholder?: string; multilinha?: boolean }

export interface TipoPonto {
  id: string;
  nome: string;
  Icon: LucideIcon;
  /** Cor do tipo: borda e ícone. O fundo usa a mesma cor bem escura. */
  cor: string;
  fundo: string;
  campos: CampoExtra[];
}

export const TIPOS: TipoPonto[] = [
  { id: 'narrativo', nome: 'Narrativo', Icon: BookOpen, cor: '#4a9fe0', fundo: '#1d3550',
    campos: [{ chave: 'gatilho', rotulo: 'Gatilho', placeholder: 'O que faz a cena acontecer' }] },
  { id: 'encontro', nome: 'Encontro', Icon: Swords, cor: '#e05050', fundo: '#4a1d1d',
    campos: [{ chave: 'terreno', rotulo: 'Terreno', placeholder: 'Clareira, pedras altas' }] },
  { id: 'item', nome: 'Item', Icon: Gem, cor: '#d4a84e', fundo: '#4a3a17',
    campos: [{ chave: 'condicao', rotulo: 'Para achar', placeholder: 'Teste ou condição para encontrar' }] },
  { id: 'npc', nome: 'NPC', Icon: User, cor: '#3dba72', fundo: '#163d27',
    campos: [
      { chave: 'npc', rotulo: 'Quem', placeholder: 'Nome do NPC' },
      { chave: 'atitude', rotulo: 'Atitude', placeholder: 'Desconfiado, amigável...' },
      { chave: 'revela', rotulo: 'O que revela', multilinha: true },
    ] },
  { id: 'segredo', nome: 'Segredo', Icon: Lock, cor: '#a78bfa', fundo: '#2e2450', campos: [] },
];

const GENERICO: TipoPonto = { id: '?', nome: 'Outro', Icon: BookOpen, cor: '#a1a1aa', fundo: '#27272a', campos: [] };

/** Tipo desconhecido (criado à mão no arquivo) aparece como genérico, só título e texto. */
export const tipoDe = (id: string): TipoPonto => TIPOS.find((t) => t.id === id) ?? { ...GENERICO, id, nome: id };

export const NOME_STATUS: Record<string, string> = { planejado: 'Planejado', ativo: 'Ativo', concluido: 'Concluído' };
