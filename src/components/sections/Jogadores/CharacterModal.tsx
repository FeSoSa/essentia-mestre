"use client";

import { useEffect, useState } from "react";
import { CheckField } from '@/components/ui/Checkbox';
import { ChevronDown, X, Package, FlaskConical, Sword, Shield, Gem, Wrench, Key, Flame, Link, User, ScrollText, ClipboardList, Plus, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/store";
import Button from "@/components/ui/Button";
import { modificador } from "@/lib/encontro";
import type { Player, ClassKit, PlayerAttributes, Race, Perfil } from "@/store/types";
import { normalizeGdriveUrl, proxyUrl } from '@/lib/gdrive';

const DEFAULT_SLOTS_FREE = 6;

const ATTR_LABELS: [keyof PlayerAttributes, string, string][] = [
  ['strength',     'Força',        'FOR'],
  ['agility',      'Agilidade',    'AGI'],
  ['intelligence', 'Intelecto',    'INT'],
  ['resistance',   'Resiliência',  'RES'],
  ['flow',         'Fluxo',        'FLX'],
  ['wisdom',       'Sabedoria',    'SAB'],
  ['presence',     'Presença',     'PRE'],
  ['defense',      'Defesa',       'DEF'],
];

const EMPTY_ATTRS: PlayerAttributes = {
  strength: 0, agility: 0, intelligence: 0, resistance: 0,
  flow: 0, wisdom: 0, presence: 0, defense: 0,
};

const PERFIL_VAZIO: Perfil = { historia: '', tracos: [], idade: '', altura: '', origem: '', faccao: '', anotacoes: '' };

const ITEM_ICON_MAP: Record<string, LucideIcon> = {
  Package, FlaskConical, Sword, Shield, Gem, Wrench, Key, Flame, Link,
};

function itemIcon(type: string, icon?: string): LucideIcon {
  if (icon && ITEM_ICON_MAP[icon]) return ITEM_ICON_MAP[icon];
  switch (type) {
    case 'weapon':    return Sword;
    case 'armor':     return Shield;
    case 'accessory': return Gem;
    case 'chave':     return Key;
    default:          return Package;
  }
}

// ── SimpleSelect ──────────────────────────────────────────────────────────────

function SimpleSelect({ value, options, placeholder = 'Selecionar…', onChange, required }: {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-e-bg border rounded-xl text-sm text-left transition-colors cursor-pointer ${
          open ? 'border-e-border2' : 'border-e-border hover:border-e-border2'
        } ${required && !value ? 'border-e-danger/40' : ''}`}>
        <span className={`flex-1 ${value ? 'text-e-text' : 'text-e-faint'}`}>{value || placeholder}</span>
        <ChevronDown size={13} className={`text-e-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {options.map(opt => (
            <button key={opt} type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full px-3 py-2 text-sm text-left cursor-pointer transition-colors ${
                opt === value ? 'bg-e-accent/10 text-e-accent' : 'hover:bg-e-card text-e-text'
              }`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Aba = 'ficha' | 'historia';

// ── CharacterModal ────────────────────────────────────────────────────────────

export default function CharacterModal({ player, onClose }: { player?: Player; onClose: () => void }) {
  const { setPlayer } = useStore();
  const [aba,         setAba]         = useState<Aba>('ficha');
  const [name,        setName]        = useState(player?.char.name ?? "");
  const [code,        setCode]        = useState(player?.code ?? "");
  const [race,        setRace]        = useState(player?.char.race ?? "");
  const [cls,         setCls]         = useState(player?.char.skillClass ?? "");
  const [sub,         setSub]         = useState(player?.char.subClass ?? "");
  const [portraitUrl, setPortraitUrl] = useState(player?.char.portraitUrl ?? "");
  const [attrs,       setAttrs]       = useState<PlayerAttributes>(player?.attributes ?? EMPTY_ATTRS);
  const [level,         setLevel]         = useState(String(player?.char.level        ?? 1));
  const [slotsClass,    setSlotsClass]    = useState(String(player?.char.slotsClass   ?? 2));
  const [slotsFree,     setSlotsFree]     = useState(String(player?.char.slotsFree    ?? DEFAULT_SLOTS_FREE));
  const [etherUnlocked,       setEtherUnlocked]       = useState(player?.ether?.unlocked ?? false);
  const [sobrecargaUnlocked,  setSobrecargaUnlocked]  = useState(player?.sobrecargaDesbloqueada ?? false);
  const [inventorySize,       setInventorySize]       = useState(String(player?.inventorySize ?? 18));
  const [expAvailable,  setExpAvailable]  = useState(String(player?.exp?.available    ?? 0));
  const [expTotal,      setExpTotal]      = useState(String(player?.exp?.total        ?? 0));
  const [perfil,        setPerfil]        = useState<Perfil>({ ...PERFIL_VAZIO, ...(player?.perfil ?? {}) });
  const [novoTraco,     setNovoTraco]     = useState('');
  const [kit,         setKit]         = useState<ClassKit | null>(null);
  const [allKits,     setAllKits]     = useState<ClassKit[]>([]);
  const [allRaces,    setAllRaces]    = useState<Race[]>([]);
  const [subclasses]  = useState<string[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [erro,        setErro]        = useState<string | null>(null);

  const saveUrl    = normalizeGdriveUrl(portraitUrl);
  const previewSrc = proxyUrl(portraitUrl);

  // Carrega kits e raças uma vez
  useEffect(() => {
    api.get<ClassKit[]>('/master/kits').then(r => setAllKits(r.data)).catch(() => {});
    api.get<Race[]>('/master/races').then(r => setAllRaces(r.data)).catch(() => {});
  }, []);

  // Quando a classe muda, aplica slots do kit correspondente
  useEffect(() => {
    if (!cls || allKits.length === 0) { setKit(null); return; }
    const found = allKits.find(k => k.skillClass === cls || k.skillClass === cls.split(' - ').pop());
    if (!found) { setKit(null); return; }
    setKit(found);
    if (!player) {
      const classSlots = found.starterSlots.filter(s => s.type === 'class').length || 2;
      setSlotsClass(String(classSlots));
    }
  }, [cls, allKits, player]);

  // Quando a raça muda, preenche atributos iniciais e inventorySize (só no cadastro, não na edição)
  useEffect(() => {
    if (player || !race || allRaces.length === 0) return;
    const found = allRaces.find(r => r.name === race);
    if (found) {
      setAttrs(found.starterAttributes);
      if (found.inventorySize) setInventorySize(String(found.inventorySize));
    }
  }, [race, allRaces, player]);

  // Resincroniza os atributos quando o jogador é atualizado por fora (socket), se o mestre ainda não mexeu
  const [attrsTouched, setAttrsTouched] = useState(false);
  useEffect(() => {
    if (player && !attrsTouched) setAttrs(player.attributes);
  }, [player, attrsTouched]);

  function setCampo<K extends keyof Perfil>(k: K, v: Perfil[K]) { setPerfil(p => ({ ...p, [k]: v })); }
  function addTraco() {
    const t = novoTraco.trim();
    if (!t || perfil.tracos.includes(t)) { setNovoTraco(''); return; }
    setCampo('tracos', [...perfil.tracos, t]);
    setNovoTraco('');
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErro(null);
    try {
      const base = {
        code, name, skillClass: cls, subClass: sub || undefined, race,
        attributes: attrs, portraitUrl: saveUrl || undefined,
        level:      isNaN(Number(level))      ? 1                  : Number(level)      || 1,
        slotsClass: isNaN(Number(slotsClass)) ? 2                  : Number(slotsClass),
        slotsFree:  isNaN(Number(slotsFree))  ? DEFAULT_SLOTS_FREE : Number(slotsFree),
        etherUnlocked,
        sobrecargaDesbloqueada: sobrecargaUnlocked,
        expAvailable: Number(expAvailable),
        expTotal:     Number(expTotal),
        inventorySize: isNaN(Number(inventorySize)) ? 18 : Number(inventorySize) || 18,
        perfil,
      };
      const res = player
        ? await api.put<Player>(`/master/players/${player.id}`, base)
        : await api.post<Player>("/master/players", {
            ...base,
            equipment: kit?.starterEquipment ?? {},
            items: kit?.starterItems ?? [],
          });

      setPlayer(res.data);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg ?? 'Não deu para salvar. Confira os campos obrigatórios.');
    } finally { setSaving(false); }
  }

  const lbl = "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";
  const raca = allRaces.find(r => r.name === race);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit}
        className="bg-e-surface border border-e-border rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <h3 className="font-semibold text-e-text">{player ? "Editar personagem" : "Novo personagem"}</h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row">

          {/* ── Identidade: como o personagem aparece ── */}
          <aside className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-e-border p-5 flex flex-col gap-4 overflow-y-auto">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-e-border bg-gradient-to-b from-e-card to-e-bg">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc} alt="Retrato do personagem" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center pb-12">
                  <User size={48} className="text-e-faint" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-e-bg via-e-bg/90 to-transparent">
                <p className="font-semibold text-e-text text-base leading-tight truncate">{name || 'Sem nome'}</p>
                <p className="text-xs text-e-sub truncate">{[race, cls].filter(Boolean).join(' · ') || 'Raça · Classe'}</p>
              </div>
            </div>

            <div>
              <label className={lbl}>Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do personagem" required />
            </div>
            <div>
              <label className={lbl}>Código de acesso</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: hero123" required />
              <p className="text-[10px] text-e-faint mt-1">O jogador entra no app com este código.</p>
            </div>
            <div>
              <label className={lbl}>Retrato</label>
              <input type="text" value={portraitUrl} onChange={(e) => setPortraitUrl(e.target.value)}
                placeholder="URL direta ou link do Google Drive" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Raça</label>
                <SimpleSelect value={race} options={allRaces.length > 0 ? allRaces.map(r => r.name) : [race].filter(Boolean)} onChange={setRace} required />
              </div>
              <div>
                <label className={lbl}>Classe</label>
                <SimpleSelect value={cls} options={allKits.map(k => k.skillClass)} onChange={setCls} required />
              </div>
            </div>
            {subclasses.length > 0 && (
              <div>
                <label className={lbl}>Subclasse</label>
                <SimpleSelect value={sub} options={['Nenhuma', ...subclasses]} onChange={v => setSub(v === 'Nenhuma' ? '' : v)} />
              </div>
            )}
            {(kit || raca) && (
              <div className="rounded-xl bg-e-card border border-e-border p-3 flex flex-col gap-1 text-[11px] text-e-sub">
                {raca && <p><span className="text-e-gold font-semibold">{raca.name}:</span> {raca.inventorySize ?? 18} espaços de inventário</p>}
                {kit && (
                  <p>
                    <span className="text-e-gold font-semibold">{kit.skillClass}:</span>{' '}
                    {[
                      kit.perks?.hasPressureBar ? 'barra de Pressão' : null,
                      kit.perks?.unarmedAttack ? `desarmado ${kit.perks.unarmedAttack.damageBase} + d20×${kit.perks.unarmedAttack.attribute}` : null,
                      kit.pvPorNivel ? `+${kit.pvPorNivel} PV/nível` : null,
                      kit.fluxoPorNivel ? `+${kit.fluxoPorNivel} Fluxo/nível` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            )}
          </aside>

          {/* ── Abas: ficha de jogo | história ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="flex gap-1 px-5 pt-4 shrink-0">
              {([['ficha', 'Ficha', ClipboardList], ['historia', 'História e traços', ScrollText]] as const).map(([id, label, Icon]) => (
                <button key={id} type="button" onClick={() => setAba(id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    aba === id ? 'bg-e-accent/15 text-e-accent' : 'text-e-faint hover:text-e-text hover:bg-e-card'}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5">
              {aba === 'ficha' ? (
                <>
                  {/* Atributos */}
                  <div>
                    <label className={lbl}>Atributos base</label>
                    <div className="grid grid-cols-4 gap-2">
                      {ATTR_LABELS.map(([key, label, short]) => {
                        const score = attrs[key];
                        const mod   = modificador(score);
                        return (
                          <div key={key} className="bg-e-card rounded-xl p-3 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-e-faint" title={label}>{short}</span>
                              <span className={`text-[10px] font-bold tabular-nums ${mod >= 0 ? 'text-e-accent' : 'text-e-danger'}`}>
                                {mod >= 0 ? '+' : ''}{mod}
                              </span>
                            </div>
                            <input
                              type="number"
                              aria-label={label}
                              value={score}
                              onChange={(e) => { setAttrsTouched(true); setAttrs(p => ({ ...p, [key]: Number(e.target.value) })); }}
                              className="!text-center !text-base !font-bold !text-e-text !bg-transparent !border-0 !p-0 !shadow-none !w-full"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progressão */}
                  <div>
                    <label className={lbl}>Progressão</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ['Nível', level, setLevel, 1],
                        ['Pontos disponíveis', expAvailable, setExpAvailable, 0],
                        ['EXP total', expTotal, setExpTotal, 0],
                      ].map(([l, v, set, min]) => (
                        <div key={l as string}>
                          <span className="text-[10px] text-e-faint mb-1 block">{l as string}</span>
                          <input type="number" min={min as number} value={v as string}
                            onChange={e => (set as (x: string) => void)(e.target.value)} className="!text-center !text-sm !font-bold" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Espaços */}
                  <div>
                    <label className={lbl}>Slots e inventário</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ['Slots de classe', slotsClass, setSlotsClass, 0, 10],
                        ['Slots livres', slotsFree, setSlotsFree, 0, 10],
                        ['Espaços de inventário', inventorySize, setInventorySize, 1, 64],
                      ].map(([l, v, set, min, max]) => (
                        <div key={l as string}>
                          <span className="text-[10px] text-e-faint mb-1 block">{l as string}</span>
                          <input type="number" min={min as number} max={max as number} value={v as string}
                            onChange={e => (set as (x: string) => void)(e.target.value)} className="!text-center !text-sm !font-bold" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recursos especiais */}
                  <div>
                    <label className={lbl}>Recursos especiais</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div className="flex flex-col gap-1">
                        <CheckField checked={etherUnlocked} onChange={setEtherUnlocked} color="purple" label="Éter desbloqueado" />
                        {etherUnlocked && <p className="text-[10px] text-e-faint pl-6">Máx = menor entre SAB ÷ 4 e 10, calculado ao salvar</p>}
                      </div>
                      <CheckField checked={sobrecargaUnlocked} onChange={setSobrecargaUnlocked} color="orange" label="Sobrecarga desbloqueada" />
                    </div>
                  </div>

                  {/* Kit */}
                  {kit && (kit.starterItems ?? []).length > 0 && (
                    <div>
                      <label className={lbl}>{player ? 'Kit da classe' : 'Itens iniciais'} · {cls}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {(kit.starterItems as { name: string; type: string; qty: number; icon?: string }[]).map((item, i) => {
                          const Icon = itemIcon(item.type, item.icon);
                          return (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-e-card border border-e-border text-xs text-e-sub">
                              <Icon size={11} className="text-e-faint shrink-0" />
                              <span>{item.name}</span>
                              {item.qty > 1 && <span className="text-e-faint">×{item.qty}</span>}
                            </div>
                          );
                        })}
                      </div>
                      {player && <p className="text-[10px] text-e-faint mt-1">Os itens do kit só entram ao criar o personagem.</p>}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className={lbl}>História</label>
                    <textarea value={perfil.historia} onChange={e => setCampo('historia', e.target.value)} rows={9}
                      placeholder="De onde veio, o que viveu, o que busca. Aparece na aba Personagem do app."
                      className="w-full resize-y text-sm leading-relaxed" />
                  </div>

                  <div>
                    <label className={lbl}>Traços</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {perfil.tracos.map(t => (
                        <span key={t} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-e-card border border-e-border text-xs text-e-text">
                          {t}
                          <button type="button" aria-label={`Remover ${t}`} onClick={() => setCampo('tracos', perfil.tracos.filter(x => x !== t))}
                            className="p-0.5 rounded text-e-faint hover:text-e-danger cursor-pointer"><X size={11} /></button>
                        </span>
                      ))}
                      {perfil.tracos.length === 0 && <span className="text-xs text-e-faint">Nenhum traço ainda.</span>}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={novoTraco} onChange={e => setNovoTraco(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTraco(); } }}
                        placeholder="Ex: Leal aos amigos" />
                      <Button type="button" variant="ghost" size="md" onClick={addTraco}><Plus size={14} /> Adicionar</Button>
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Detalhes</label>
                    <div className="grid grid-cols-2 gap-3">
                      {([['idade', 'Idade', 'Ex: 24 anos'], ['altura', 'Altura', 'Ex: 1,82 m'], ['origem', 'Origem', 'Ex: Vale de Kerem'], ['faccao', 'Facção', 'Ex: Ordem da Brasa']] as const).map(([k, l, ph]) => (
                        <div key={k}>
                          <span className="text-[10px] text-e-faint mb-1 block">{l}</span>
                          <input type="text" value={perfil[k]} onChange={e => setCampo(k, e.target.value)} placeholder={ph} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {player && perfil.anotacoes && (
                    <div>
                      <label className={lbl}>Anotações do jogador</label>
                      <p className="text-xs text-e-sub whitespace-pre-wrap rounded-xl bg-e-card border border-e-border p-3">{perfil.anotacoes}</p>
                      <p className="text-[10px] text-e-faint mt-1">Só o jogador edita, pelo app.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-e-border shrink-0">
          <p className="flex-1 text-xs text-e-danger">{erro}</p>
          <Button type="button" variant="ghost" size="md" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? "Salvando…" : player ? "Salvar" : "Criar personagem"}
          </Button>
        </div>
      </form>
    </div>
  );
}
