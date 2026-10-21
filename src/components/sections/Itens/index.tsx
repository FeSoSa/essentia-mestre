"use client";

import Button from "@/components/ui/Button";
import SectionHeader, { Page } from "@/components/ui/SectionHeader";
import SearchInput, { Tabs } from "@/components/ui/SearchInput";
import { api } from "@/lib/api";
import { RARITY_COLORS, RARITY_LABELS, RARITY_ORDER, type Rarity } from "@/lib/rarity";
import { REGIAO_COMUM, daRegiao, regioesDoCatalogo } from "@/lib/achado";
import type { ItemCatalog } from "@/store/types";
import { ArrowDownUp, Check, ChevronDown, Dices, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import ItemCard from "./ItemCard";
import ItemModal from "./ItemModal";
import SendItemModal from "./SendItemModal";
import SorteadorModal from "./SorteadorModal";

type Tab = "armas" | "armaduras" | "acessorios" | "itens";

const TAB_FILTER: Record<Tab, (i: ItemCatalog) => boolean> = {
  armas: (i) => i.type === "weapon",
  armaduras: (i) => i.type === "armor",
  acessorios: (i) => i.type === "accessory",
  itens: (i) => i.type === "normal" || i.type === "chave",
};

const TAB_DEFAULT_TYPE: Record<Tab, string> = {
  armas: "weapon",
  armaduras: "armor",
  acessorios: "accessory",
  itens: "normal",
};

const TAB_LABELS: Record<Tab, string> = {
  armas: "Armas",
  armaduras: "Armaduras",
  acessorios: "Acessórios",
  itens: "Itens",
};

const TAB_NOVO: Record<Tab, string> = {
  armas: "Nova arma",
  armaduras: "Nova armadura",
  acessorios: "Novo acessório",
  itens: "Novo item",
};

const WEAPON_TYPE_OPTS = [
  { value: "espadas", label: "Espadas" },
  { value: "rapieiras", label: "Rapieiras" },
  { value: "alabardas", label: "Alabardas" },
  { value: "lancas", label: "Lanças" },
  { value: "machados-de-guerra", label: "Machados de guerra" },
  { value: "machadinhas", label: "Machadinhas" },
  { value: "martelos", label: "Martelos" },
  { value: "armas-colossais", label: "Armas colossais" },
  { value: "adagas", label: "Adagas" },
  { value: "garras", label: "Garras" },
  { value: "cajado", label: "Cajado" },
  { value: "grimorio", label: "Grimório" },
  { value: "orbe", label: "Orbe" },
  { value: "arcanos", label: "Arcanos" },
  { value: "arcos", label: "Arcos" },
  { value: "bestas", label: "Bestas" },
  { value: "pistolas", label: "Pistolas" },
  { value: "luvas-manoplas", label: "Luvas & manoplas" },
  { value: "escudos", label: "Escudos" },
];

const ARMOR_WEIGHT_OPTS = [
  { value: "leve", label: "Leve" },
  { value: "média", label: "Média" },
  { value: "pesada", label: "Pesada" },
];

const EQUIP_SLOT_OPTS = [
  { value: "amulet", label: "Amuleto" },
  { value: "ring", label: "Anel" },
  { value: "utility", label: "Utilitário" },
];

const SUBTYPE_OPTS = [
  { value: "consumivel", label: "Consumível" },
  { value: "drop", label: "Drop" },
  { value: "chave", label: "Chave" },
  { value: "misc", label: "Misc" },
];

/** O filtro próprio de cada aba: nome do botão, campo do item e opções. */
const FILTRO_DA_ABA: Record<Tab, { rotulo: string; campo: (i: ItemCatalog) => string | undefined; opts: { value: string; label: string }[] }> = {
  armas: { rotulo: "Tipo", campo: (i) => i.weaponType, opts: WEAPON_TYPE_OPTS },
  armaduras: { rotulo: "Peso", campo: (i) => i.armorWeight, opts: ARMOR_WEIGHT_OPTS },
  acessorios: { rotulo: "Espaço", campo: (i) => i.equipSlot, opts: EQUIP_SLOT_OPTS },
  itens: { rotulo: "Subtipo", campo: (i) => i.subtype, opts: SUBTYPE_OPTS },
};

/** Valor do filtro de raridade para itens sem raridade. */
const SEM_RARIDADE = "__sem__";

type Ordem = "" | "nome" | "raridade-asc" | "raridade-desc" | "dano" | "valor";
const ORDEM_OPTS: { value: Ordem; label: string }[] = [
  { value: "", label: "Ordem do catálogo" },
  { value: "nome", label: "Nome (A a Z)" },
  { value: "raridade-asc", label: "Raridade: comum primeiro" },
  { value: "raridade-desc", label: "Raridade: mítico primeiro" },
  { value: "dano", label: "Dano (maior primeiro)" },
  { value: "valor", label: "Valor em Tyd (maior primeiro)" },
];

interface Filtros {
  search: string;
  raridades: string[];
  regioes: string[];
  unico: boolean;
  /** Opções marcadas no filtro próprio da aba (tipo, peso, espaço ou subtipo). */
  daAba: string[];
  ordem: Ordem;
}

const VAZIO: Filtros = { search: "", raridades: [], regioes: [], unico: false, daAba: [], ordem: "" };

const CHAVE_STORAGE = "essentia.itens.filtros.v2";

/** Aba e filtros da última visita (só neste navegador). */
function lerSalvo(): { tab: Tab; filtros: Filtros } {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE) ?? "null");
    return {
      tab: salvo?.tab in TAB_LABELS ? salvo.tab : "armas",
      filtros: { ...VAZIO, ...(salvo?.filtros ?? {}) },
    };
  } catch {
    return { tab: "armas", filtros: VAZIO };
  }
}

type Faceta = "busca" | "raridade" | "regiao" | "unico" | "daAba";

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** O item passa nos filtros? `exceto` ignora uma faceta (para contar quantos sobram em cada opção dela). */
function passa(i: ItemCatalog, f: Filtros, tab: Tab, exceto?: Faceta): boolean {
  if (exceto !== "busca" && f.search && !semAcento(`${i.name} ${i.desc ?? ""}`).includes(semAcento(f.search))) return false;
  if (exceto !== "raridade" && f.raridades.length && !f.raridades.includes(i.rarity || SEM_RARIDADE)) return false;
  if (exceto !== "regiao" && f.regioes.length && !f.regioes.some((r) => daRegiao(i, r))) return false;
  if (exceto !== "unico" && f.unico && !i.unico) return false;
  if (exceto !== "daAba" && f.daAba.length && !f.daAba.includes(FILTRO_DA_ABA[tab].campo(i) ?? "")) return false;
  return true;
}

function ordenar(lista: ItemCatalog[], ordem: Ordem): ItemCatalog[] {
  if (!ordem) return lista;
  const rar = (i: ItemCatalog) => RARITY_ORDER.indexOf((i.rarity ?? "branco") as Rarity);
  const nome = (a: ItemCatalog, b: ItemCatalog) => a.name.localeCompare(b.name, "pt-BR");
  const cmp: Record<Exclude<Ordem, "">, (a: ItemCatalog, b: ItemCatalog) => number> = {
    nome,
    "raridade-asc": (a, b) => rar(a) - rar(b) || nome(a, b),
    "raridade-desc": (a, b) => rar(b) - rar(a) || nome(a, b),
    dano: (a, b) => (b.damageBase ?? -1) - (a.damageBase ?? -1),
    valor: (a, b) => (b.goldValue ?? -1) - (a.goldValue ?? -1),
  };
  return [...lista].sort(cmp[ordem]);
}

interface Opcao { value: string; label: string; cor?: string; count: number }

const botaoBarra = (ativo: boolean) =>
  `flex items-center gap-1.5 h-9 px-3 border rounded-lg text-sm transition-colors whitespace-nowrap cursor-pointer ${
    ativo ? "bg-e-card border-e-border2 text-e-text" : "bg-e-bg border-e-border text-e-faint hover:text-e-text hover:border-e-border2"}`;

/** Botão da barra que abre uma lista para marcar várias opções, com a contagem de cada uma. */
function MultiFiltro({ rotulo, opcoes, marcadas, onChange }: {
  rotulo: string; opcoes: Opcao[]; marcadas: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const n = marcadas.length;
  const alterna = (v: string) => onChange(marcadas.includes(v) ? marcadas.filter((x) => x !== v) : [...marcadas, v]);
  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <button type="button" onClick={() => setOpen((v) => !v)} className={botaoBarra(n > 0)}>
        {rotulo}
        {/* Só a quantidade: o que está marcado aparece nas etiquetas abaixo, e o botão não muda de largura */}
        {n > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-e-accent/20 text-e-accent text-[11px] font-bold flex items-center justify-center tabular-nums">{n}</span>}
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 w-60 max-h-[360px] overflow-y-auto bg-e-surface border border-e-border rounded-xl shadow-2xl py-1">
          {opcoes.map((o) => {
            const on = marcadas.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => alterna(o.value)}
                className={`w-full px-3 py-1.5 flex items-center gap-2.5 text-sm text-left hover:bg-e-card transition-colors cursor-pointer ${!on && o.count === 0 ? "opacity-40" : ""}`}>
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? "bg-e-accent border-e-accent text-black" : "border-white/20"}`}>
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                {o.cor && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: o.cor }} />}
                <span className="flex-1 truncate" style={{ color: o.cor }}>{o.label}</span>
                <span className="text-[11px] tabular-nums text-e-faint">{o.count}</span>
              </button>
            );
          })}
          {n > 0 && (
            <button type="button" onClick={() => onChange([])}
              className="w-full mt-1 px-3 py-2 border-t border-white/[0.06] text-xs text-left text-e-faint hover:text-e-text cursor-pointer">
              Desmarcar todas
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function OrdemDropdown({ value, onChange }: { value: Ordem; onChange: (v: Ordem) => void }) {
  const [open, setOpen] = useState(false);
  const atual = ORDEM_OPTS.find((o) => o.value === value);
  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <button type="button" onClick={() => setOpen((v) => !v)} className={botaoBarra(!!value)} title="Ordenar">
        <ArrowDownUp size={12} className="shrink-0" />
        {value ? atual?.label : "Ordenar"}
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-full bg-e-surface border border-e-border rounded-xl shadow-2xl py-1">
          {ORDEM_OPTS.map((o) => (
            <button key={o.value || "padrao"} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full px-3 py-2 text-sm text-left whitespace-nowrap hover:bg-e-card transition-colors cursor-pointer flex items-center gap-2 ${value === o.value ? "text-e-accent" : "text-e-text"}`}>
              <span className="w-3">{value === o.value && <Check size={12} />}</span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Etiqueta de um filtro ativo, com o X para tirar. */
function Etiqueta({ cor, onRemove, children }: { cor?: string; onRemove: () => void; children: ReactNode }) {
  return (
    <span className="h-7 pl-2.5 pr-1 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-semibold flex items-center gap-1.5"
      style={cor ? { color: cor, borderColor: cor + "55" } : undefined}>
      {children}
      <button type="button" onClick={onRemove} title="Tirar filtro"
        className="w-5 h-5 rounded flex items-center justify-center text-e-faint hover:text-e-text hover:bg-white/10 cursor-pointer">
        <X size={12} />
      </button>
    </span>
  );
}

export default function Itens() {
  const [items, setItems] = useState<ItemCatalog[]>([]);
  const [carregou, setCarregou] = useState(false);
  const [tab, setTab] = useState<Tab>(() => lerSalvo().tab);
  const [editing, setEditing] = useState<ItemCatalog | undefined>();
  const [sending, setSending] = useState<ItemCatalog | undefined>();
  const [showNew, setShowNew] = useState(false);
  const [showSorteio, setShowSorteio] = useState(false);
  const [salvos, setF] = useState<Filtros>(() => lerSalvo().filtros);

  useEffect(() => {
    api
      .get<ItemCatalog[]>("/items")
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setCarregou(true));
  }, []);

  const regioes = useMemo(() => regioesDoCatalogo(items), [items]);

  // Filtro salvo que não existe mais (região apagada ou renomeada) não pode esconder itens sem aparecer na tela
  const f: Filtros = carregou
    ? { ...salvos, regioes: salvos.regioes.filter((r) => r === REGIAO_COMUM || regioes.includes(r)) }
    : salvos;

  // Lembra aba e filtros para a próxima visita
  useEffect(() => {
    try { localStorage.setItem(CHAVE_STORAGE, JSON.stringify({ tab, filtros: salvos })); } catch {}
  }, [tab, salvos]);

  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setF({ ...f, [k]: v });
  const limpar = () => setF({ ...VAZIO, ordem: f.ordem });

  function changeTab(t: Tab) {
    setTab(t);
    setF({ ...f, daAba: [] });
  }

  function handleSaved(i: ItemCatalog) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === i.id);
      return idx >= 0 ? prev.map((x, j) => (j === idx ? i : x)) : [...prev, i];
    });
  }

  async function handleDelete(i: ItemCatalog) {
    if (!confirm(`Deletar "${i.name}"?`)) return;
    await api.delete(`/items/${i.id}`).catch(() => {});
    setItems((prev) => prev.filter((x) => x.id !== i.id));
  }

  const tabItems = items.filter(TAB_FILTER[tab]);
  const visible = ordenar(tabItems.filter((i) => passa(i, f, tab)), f.ordem);

  /** Quantos itens da aba sobram marcando esta opção (com os outros filtros como estão). */
  const conta = (faceta: Faceta, cond: (i: ItemCatalog) => boolean) =>
    tabItems.filter((i) => passa(i, f, tab, faceta) && cond(i)).length;

  // O número de cada aba respeita os filtros que valem em todas as abas
  const contaAba = (t: Tab) => items.filter(TAB_FILTER[t]).filter((i) => passa(i, { ...f, daAba: [] }, t)).length;

  const opcoesRaridade: Opcao[] = [
    ...RARITY_ORDER.filter((r) => tabItems.some((i) => i.rarity === r)).map((r) => ({
      value: r as string, label: RARITY_LABELS[r], cor: RARITY_COLORS[r], count: conta("raridade", (i) => i.rarity === r),
    })),
    ...(tabItems.some((i) => !i.rarity) ? [{ value: SEM_RARIDADE, label: "Sem raridade", count: conta("raridade", (i) => !i.rarity) }] : []),
  ];
  const opcoesRegiao: Opcao[] = [
    ...regioes.map((r) => ({ value: r, label: r, count: conta("regiao", (i) => daRegiao(i, r)) })),
    { value: REGIAO_COMUM, label: "Sem região", count: conta("regiao", (i) => daRegiao(i, REGIAO_COMUM)) },
  ];
  const filtroAba = FILTRO_DA_ABA[tab];
  const opcoesAba: Opcao[] = filtroAba.opts
    .filter((o) => tabItems.some((i) => filtroAba.campo(i) === o.value))
    .map((o) => ({ ...o, count: conta("daAba", (i) => filtroAba.campo(i) === o.value) }));
  const temUnicos = items.some((i) => i.unico);

  const nomeRaridade = (r: string) => (r === SEM_RARIDADE ? "Sem raridade" : RARITY_LABELS[r as Rarity] ?? r);
  const filtrosAtivos = !!(f.search || f.raridades.length || f.regioes.length || f.unico || f.daAba.length);

  return (
    <Page>
      <SectionHeader
        title="Itens"
        count={items.length}
        subtitle="Catálogo de armas, armaduras, acessórios e itens. O avião de papel envia o item para um jogador."
        action={
          <>
            <Button variant="ghost" onClick={() => setShowSorteio(true)} title="O sistema escolhe um item pensando no jogador">
              <Dices size={15} /> Sortear achado
            </Button>
            <Button variant="primary" onClick={() => setShowNew(true)}>
              <Plus size={15} /> {TAB_NOVO[tab]}
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Tabs
          value={tab}
          onChange={changeTab}
          tabs={(Object.keys(TAB_LABELS) as Tab[]).map((t) => ({ id: t, label: TAB_LABELS[t], count: contaAba(t) }))}
        />
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <SearchInput value={f.search} onChange={(v) => set("search", v)} placeholder="Buscar no nome ou na descrição…" width={260} />
          {opcoesRaridade.length > 0 && (
            <MultiFiltro rotulo="Raridade" opcoes={opcoesRaridade} marcadas={f.raridades} onChange={(v) => set("raridades", v)} />
          )}
          <MultiFiltro rotulo="Região" opcoes={opcoesRegiao} marcadas={f.regioes} onChange={(v) => set("regioes", v)} />
          {opcoesAba.length > 0 && (
            <MultiFiltro rotulo={filtroAba.rotulo} opcoes={opcoesAba} marcadas={f.daAba} onChange={(v) => set("daAba", v)} />
          )}
          {temUnicos && (
            <button type="button" onClick={() => set("unico", !f.unico)} title="Mostrar só os itens únicos"
              className={botaoBarra(f.unico)} style={f.unico ? { color: "#d4a84e", borderColor: "#d4a84e66" } : undefined}>
              <Sparkles size={13} /> Únicos
            </button>
          )}
          <OrdemDropdown value={f.ordem} onChange={(v) => set("ordem", v)} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap min-h-7 mb-5 text-xs">
        {filtrosAtivos ? (
          <>
            <span className="text-e-faint mr-1">
              <span className="text-e-text font-semibold tabular-nums">{visible.length}</span> de {tabItems.length}
            </span>
            {f.search && <Etiqueta onRemove={() => set("search", "")}>&ldquo;{f.search}&rdquo;</Etiqueta>}
            {f.raridades.map((r) => (
              <Etiqueta key={r} cor={RARITY_COLORS[r as Rarity]} onRemove={() => set("raridades", f.raridades.filter((x) => x !== r))}>
                {nomeRaridade(r)}
              </Etiqueta>
            ))}
            {f.regioes.map((r) => (
              <Etiqueta key={r} onRemove={() => set("regioes", f.regioes.filter((x) => x !== r))}>
                {r === REGIAO_COMUM ? "Sem região" : r}
              </Etiqueta>
            ))}
            {f.daAba.map((v) => (
              <Etiqueta key={v} onRemove={() => set("daAba", f.daAba.filter((x) => x !== v))}>
                {filtroAba.opts.find((o) => o.value === v)?.label ?? v}
              </Etiqueta>
            ))}
            {f.unico && <Etiqueta cor="#d4a84e" onRemove={() => set("unico", false)}>Únicos</Etiqueta>}
            <button type="button" onClick={limpar} className="ml-1 text-e-faint hover:text-e-text transition-colors cursor-pointer">
              Limpar tudo
            </button>
          </>
        ) : (
          <span className="text-e-faint">{tabItems.length} {tabItems.length === 1 ? "item" : "itens"}</span>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <p className="text-e-faint text-sm">
            {filtrosAtivos ? "Nenhum item com esses filtros nesta aba." : "Nada nesta categoria ainda."}
          </p>
          {filtrosAtivos && (
            <Button variant="ghost" onClick={limpar}>
              <X size={14} /> Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {visible.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onDelete={() => handleDelete(item)}
              onSend={() => setSending(item)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <ItemModal
          defaultType={TAB_DEFAULT_TYPE[tab]}
          regioesConhecidas={regioes}
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <ItemModal
          item={editing}
          regioesConhecidas={regioes}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
      {showSorteio && <SorteadorModal catalogo={items} onClose={() => setShowSorteio(false)} />}
      {sending && (
        <SendItemModal item={sending} onClose={() => setSending(undefined)} />
      )}
    </Page>
  );
}
