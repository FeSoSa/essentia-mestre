'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { proxyUrl } from '@/lib/gdrive';
import type { AllyAttack, AllyTemplate } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props { onClose: () => void; }

type Tab = 'catalogo' | 'custom';

const is = { background: '#1a2e24', color: '#c8e8d8', border: '1px solid #2a4a3a' };
const ic = 'text-sm rounded px-2 py-1.5 outline-none w-full';

/* ── Catalog Tab ─────────────────────────────────────────────── */
function CatalogTab({ onClose }: { onClose: () => void }) {
  const [templates,  setTemplates]  = useState<AllyTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    api.get<AllyTemplate[]>('/allies').then((r) => {
      setTemplates(r.data);
      if (r.data.length > 0) setSelectedId(r.data[0].id);
    }).catch(() => {});
  }, []);

  const selected = templates.find((t) => t.id === selectedId);

  async function addToCombat() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post('/combat/allies', {
        ally: {
          templateId: selected.id,
          name: selected.name,
          type: selected.type,
          hpMax: selected.hpMax,
          hpCurrent: selected.hpMax,
          portraitUrl: selected.portraitUrl ?? null,
          attributes: selected.attributes,
          attacks: selected.attacks,
          desc: selected.desc,
          notes: '',
        },
      });
      onClose();
    } catch { setLoading(false); }
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: '#5a8a70' }}>
        Nenhum aliado no catálogo. Cadastre na seção Bestiário.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
        {templates.map((t) => (
          <button key={t.id} onClick={() => setSelectedId(t.id)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors"
            style={{
              background: selectedId === t.id ? '#1f3d2e' : '#1a2e24',
              border: `1px solid ${selectedId === t.id ? '#4ade80' : '#2a4a3a'}`,
              color: '#c8e8d8',
            }}>
            <div className="w-8 h-8 rounded overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: '#0f1a13' }}>
              {t.portraitUrl ? (
                <img src={proxyUrl(t.portraitUrl)} alt={t.name} className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <UserRound size={16} style={{ color: '#5a8a70' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.name}</p>
              <p className="text-xs" style={{ color: '#5a8a70' }}>{t.type || 'Aliado'} · HP {t.hpMax}</p>
            </div>
          </button>
        ))}
      </div>

      {selected?.desc && (
        <p className="text-xs italic px-1" style={{ color: '#5a8a70' }}>{selected.desc}</p>
      )}

      <Button variant="primary" size="sm" onClick={addToCombat} disabled={!selected || loading}>
        {loading ? 'Adicionando…' : 'Adicionar ao combate'}
      </Button>
    </div>
  );
}

/* ── Custom Tab ──────────────────────────────────────────────── */
function CustomTab({ onClose }: { onClose: () => void }) {
  const [name,        setName]        = useState('');
  const [type,        setType]        = useState('');
  const [hpMax,       setHpMax]       = useState(20);
  const [portraitUrl, setPortraitUrl] = useState('');
  const [str,         setStr]         = useState(10);
  const [agi,         setAgi]         = useState(10);
  const [int_,        setInt]         = useState(10);
  const [def,         setDef]         = useState(5);
  const [attacks,     setAttacks]     = useState<AllyAttack[]>([{ name: '', damage: '' }]);
  const [desc,        setDesc]        = useState('');
  const [loading,     setLoading]     = useState(false);

  function addAttack()  { setAttacks((a) => [...a, { name: '', damage: '' }]); }
  function removeAttack(i: number) { setAttacks((a) => a.filter((_, j) => j !== i)); }
  function updateAttack(i: number, f: keyof AllyAttack, v: string) {
    setAttacks((a) => a.map((x, j) => j === i ? { ...x, [f]: v } : x));
  }

  async function addToCombat() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post('/combat/allies', {
        ally: {
          name: name.trim(), type: type.trim(), hpMax, hpCurrent: hpMax,
          portraitUrl: portraitUrl || null,
          attributes: { strength: str, agility: agi, intelligence: int_, defense: def },
          attacks: attacks.filter((a) => a.name.trim()),
          desc, notes: '',
        },
      });
      onClose();
    } catch { setLoading(false); }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Portrait preview + name */}
      <div className="flex gap-3 items-center">
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: '#1a2e24', border: '1px solid #2a4a3a' }}>
          {portraitUrl ? (
            <img src={proxyUrl(portraitUrl)} alt="" className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <UserRound size={24} style={{ color: '#5a8a70' }} />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className={ic} style={is} placeholder="Nome" />
          <input value={portraitUrl} onChange={(e) => setPortraitUrl(e.target.value)}
            className={ic} style={is} placeholder="URL da imagem (opcional)" />
        </div>
      </div>

      <input value={type} onChange={(e) => setType(e.target.value)}
        className={ic} style={is} placeholder="Tipo (ex: Humano, Criatura…)" />

      {/* HP + attrs */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'HP', value: hpMax, set: setHpMax },
          { label: 'FOR', value: str,  set: setStr   },
          { label: 'AGI', value: agi,  set: setAgi   },
          { label: 'INT', value: int_, set: setInt   },
          { label: 'DEF', value: def,  set: setDef   },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#5a8a70' }}>{label}</p>
            <input type="number" value={value} onChange={(e) => set(Number(e.target.value))}
              className="w-full text-sm rounded px-1 py-1.5 outline-none text-center" style={is} />
          </div>
        ))}
      </div>

      {/* Attacks */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a8a70' }}>Ataques</p>
          <button onClick={addAttack} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
            <Plus size={12} /> Adicionar
          </button>
        </div>
        {attacks.map((atk, i) => (
          <div key={i} className="flex gap-2">
            <input value={atk.name} onChange={(e) => updateAttack(i, 'name', e.target.value)}
              className={ic} style={is} placeholder="Nome do ataque" />
            <input value={atk.damage} onChange={(e) => updateAttack(i, 'damage', e.target.value)}
              className="w-20 text-sm rounded px-2 py-1.5 outline-none font-mono" style={is} placeholder="1d6+2" />
            <button onClick={() => removeAttack(i)} className="opacity-40 hover:opacity-80 shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
        className="w-full text-sm rounded px-2 py-1.5 resize-none outline-none placeholder:opacity-40" style={is}
        placeholder="Descrição (visível ao jogador)…" />

      <Button variant="primary" size="sm" onClick={addToCombat} disabled={!name.trim() || loading}>
        {loading ? 'Adicionando…' : 'Adicionar ao combate'}
      </Button>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────── */
export default function AddAllyModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('catalogo');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[400px] max-h-[90vh] overflow-y-auto rounded-xl border p-5 flex flex-col gap-4"
        style={{ background: '#151e1a', borderColor: '#2a4a3a', color: '#c8e8d8' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Adicionar aliado</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>

        <div className="flex gap-1 rounded-lg p-1" style={{ background: '#0f1a13' }}>
          {(['catalogo', 'custom'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded text-xs font-semibold transition-colors"
              style={tab === t ? { background: '#1f3d2e', color: '#4ade80' } : { color: '#5a8a70' }}>
              {t === 'catalogo' ? 'Catálogo' : 'Personalizado'}
            </button>
          ))}
        </div>

        {tab === 'catalogo' ? <CatalogTab onClose={onClose} /> : <CustomTab onClose={onClose} />}
      </div>
    </div>
  );
}
