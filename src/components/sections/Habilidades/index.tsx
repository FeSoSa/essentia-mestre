'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Plus, Settings2 } from 'lucide-react';
import RegrasModal from './RegrasModal';
import { api } from '@/lib/api';
import SectionHeader, { Page } from '@/components/ui/SectionHeader';
import SearchInput, { Tabs } from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import SkillCard, { type Skill, type Essencia } from './SkillCard';
import SkillModal from './SkillModal';
import type { ItemCatalog, ClassKit } from '@/store/types';

type Tab = 'general' | 'class' | 'weapon' | 'essencia' | 'mestre' | 'inimigo';
const TAB_LABELS: Record<Tab, string> = { general: 'Geral', class: 'Classe', weapon: 'Arma', essencia: 'Essência', mestre: 'Mestre', inimigo: 'Inimigos' };

const WEAPON_TYPE_OPTS = [
  { value: 'espadas',            label: 'Espadas'            },
  { value: 'rapieiras',          label: 'Rapieiras'          },
  { value: 'alabardas',          label: 'Alabardas'          },
  { value: 'lancas',             label: 'Lanças'             },
  { value: 'machados-de-guerra', label: 'Machados de guerra' },
  { value: 'machadinhas',        label: 'Machadinhas'        },
  { value: 'martelos',           label: 'Martelos'           },
  { value: 'armas-colossais',    label: 'Armas colossais'    },
  { value: 'adagas',             label: 'Adagas'             },
  { value: 'garras',             label: 'Garras'             },
  { value: 'cajado',             label: 'Cajado'             },
  { value: 'grimorio',           label: 'Grimório'           },
  { value: 'orbe',               label: 'Orbe'               },
  { value: 'arcos',              label: 'Arcos'              },
  { value: 'bestas',             label: 'Bestas'             },
  { value: 'pistolas',           label: 'Pistolas'           },
  { value: 'luvas-manoplas',     label: 'Luvas & manoplas'   },
  { value: 'escudos',            label: 'Escudos'            },
];

function FilterDropdown({ value, onChange, placeholder, options }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const active = !!value;

  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-9 px-3 border rounded-lg text-sm transition-colors whitespace-nowrap cursor-pointer ${
          active
            ? 'bg-e-card border-e-border2 text-e-text'
            : 'bg-e-bg border-e-border text-e-faint hover:text-e-text hover:border-e-border2'
        }`}
      >
        {selected?.label ?? placeholder}
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-full bg-e-surface border border-e-border rounded-xl shadow-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full px-3 py-2 text-sm text-left transition-colors hover:bg-e-card ${!active ? 'text-e-accent' : 'text-e-faint'}`}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors ${value === opt.value ? 'text-e-accent' : 'text-e-text'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Habilidades() {
  const [skills,     setSkills]     = useState<Skill[]>([]);
  const [essencias,  setEssencias]  = useState<Essencia[]>([]);
  const [classNames, setClassNames] = useState<string[]>([]);
  const [weapons,    setWeapons]    = useState<ItemCatalog[]>([]);
  const [tab,        setTab]        = useState<Tab>('general');
  const [editing,    setEditing]    = useState<Skill | undefined>();
  const [showNew,    setShowNew]    = useState(false);
  const [showRegras, setShowRegras] = useState(false);

  const [search,           setSearch]           = useState('');
  const [filterClass,      setFilterClass]      = useState('');
  const [filterWeaponType, setFilterWeaponType] = useState('');
  const [filterEssencia,   setFilterEssencia]   = useState('');

  useEffect(() => {
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
    api.get<Essencia[]>('/master/essencias').then((r) => setEssencias(r.data)).catch(() => {});
    api.get<ClassKit[]>('/master/kits').then((r) => setClassNames([...new Set(r.data.map((k) => k.skillClass))])).catch(() => {});
    api.get<ItemCatalog[]>('/items').then((r) =>
      setWeapons(r.data.filter((i) => i.type === 'weapon'))
    ).catch(() => {});
  }, []);

  function changeTab(t: Tab) {
    setTab(t);
    setFilterClass('');
    setFilterWeaponType('');
    setFilterEssencia('');
  }

  function clearFilters() {
    setSearch('');
    setFilterClass('');
    setFilterWeaponType('');
    setFilterEssencia('');
  }

  function handleSaved(s: Skill) {
    setSkills((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      return idx >= 0 ? prev.map((x, i) => (i === idx ? s : x)) : [...prev, s];
    });
  }

  async function handleDelete(s: Skill) {
    if (!confirm(`Deletar "${s.name}"?`)) return;
    await api.delete(`/skills/${s.id}`).catch(() => {});
    setSkills((prev) => prev.filter((x) => x.id !== s.id));
  }

  function filterTab(s: Skill, t: Tab): boolean {
    if (t === 'general') return s.type === 'class' && !s.skillClass;
    if (t === 'class')   return s.type === 'class' && !!s.skillClass;
    if (t === 'mestre')  return s.type === 'mestre';
    if (t === 'inimigo') return s.type === 'inimigo';
    return s.type === t;
  }

  const busca = (s: Skill) => !search || s.name.toLowerCase().includes(search.toLowerCase());
  const tabSkills = skills.filter((s) => filterTab(s, tab));
  const visible = tabSkills
    .filter(busca)
    .filter((s) => !filterClass || s.skillClass === filterClass)
    .filter((s) => !filterWeaponType || (s.weaponTypes ?? (s.weaponType ? [s.weaponType] : [])).includes(filterWeaponType))
    .filter((s) => !filterEssencia || s.essenciaId === filterEssencia);

  const hasFilters = !!(search || filterClass || filterWeaponType || filterEssencia);
  const isFiltered = hasFilters && visible.length !== tabSkills.length;

  const classOpts      = classNames.map((c) => ({ value: c, label: c }));
  const essenciaOpts   = essencias.map((e) => ({ value: e.id, label: e.name }));

  return (
    <Page>
      <SectionHeader
        title="Habilidades"
        count={skills.length}
        subtitle="Habilidades de classe, arma, essência, mestre e inimigos. Clique num card para editar."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowRegras(true)} title="Regras de maestria e custos">
              <Settings2 size={15} /> Regras
            </Button>
            <Button variant="primary" onClick={() => setShowNew(true)}>
              <Plus size={15} /> Nova habilidade
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Tabs value={tab} onChange={changeTab}
          tabs={(Object.keys(TAB_LABELS) as Tab[]).map((t) => ({ id: t, label: TAB_LABELS[t], count: skills.filter((s) => filterTab(s, t)).filter(busca).length }))} />

        {/* Filters */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar pelo nome…" />

          {tab === 'class' && classOpts.length > 0 && (
            <FilterDropdown
              value={filterClass}
              onChange={setFilterClass}
              placeholder="Todas as classes"
              options={classOpts}
            />
          )}

          {tab === 'weapon' && (
            <FilterDropdown
              value={filterWeaponType}
              onChange={setFilterWeaponType}
              placeholder="Tipo de arma"
              options={WEAPON_TYPE_OPTS}
            />
          )}

          {tab === 'essencia' && essenciaOpts.length > 0 && (
            <FilterDropdown
              value={filterEssencia}
              onChange={setFilterEssencia}
              placeholder="Todas as essências"
              options={essenciaOpts}
            />
          )}

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-e-faint hover:text-e-sub transition-colors cursor-pointer">
              Limpar filtros
            </button>
          )}

          {isFiltered && (
            <span className="text-xs text-e-faint">
              {visible.length} de {tabSkills.length}
            </span>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-16">
          {hasFilters
            ? 'Nenhuma habilidade corresponde aos filtros.'
            : 'Nenhuma habilidade nesta categoria ainda.'}
        </p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {visible.map((s) => (
            <SkillCard
              key={s.id}
              skill={s}
              essencias={essencias}
              weapons={weapons}
              onEdit={() => setEditing(s)}
              onDelete={() => handleDelete(s)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <SkillModal
          essencias={essencias}
          classes={classNames}
          weapons={weapons}
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}
      {showRegras && <RegrasModal onClose={() => setShowRegras(false)} />}
      {editing && (
        <SkillModal
          skill={editing}
          essencias={essencias}
          classes={classNames}
          weapons={weapons}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
    </Page>
  );
}
