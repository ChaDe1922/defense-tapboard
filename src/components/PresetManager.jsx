import { useState, useMemo } from 'react';
import { useGame } from '../lib/GameContext';
import { getAllPresets, getLookupsByType } from '../lib/config-manager';

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition';
const selectClass = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition appearance-none';

const FILTERS = ['All', 'Active', 'Favorites', 'Inactive'];

// ── Icons ────────────────────────────────────────────────────────────

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${filled ? 'text-amber-500' : 'text-slate-400'}`}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ── Add/Edit Form ────────────────────────────────────────────────────

function PresetForm({ preset, lookups, onSave, onCancel }) {
  const playTypeOptions = getLookupsByType(lookups, 'play_type').filter((l) => l.active);
  const blitzOptions = getLookupsByType(lookups, 'blitz').filter((l) => l.active);
  const stuntOptions = getLookupsByType(lookups, 'line_stunt').filter((l) => l.active);

  const [name, setName] = useState(preset?.name || '');
  const [playType, setPlayType] = useState(preset?.playType || '');
  const [blitz, setBlitz] = useState(preset?.blitz || '');
  const [lineStunt, setLineStunt] = useState(preset?.lineStunt || '');
  const [favorite, setFavorite] = useState(preset?.favorite || false);
  const [active, setActive] = useState(preset?.active !== false);
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = true;
    if (!playType) errs.playType = true;
    if (!blitz) errs.blitz = true;
    if (!lineStunt) errs.lineStunt = true;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    onSave({ name: name.trim(), playType, blitz, lineStunt, favorite, active });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1">
          Preset name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })); }}
          placeholder="e.g. Chicago Pin"
          className={`${inputClass} ${errors.name ? 'ring-2 ring-rose-400 border-rose-400' : ''}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Play type <span className="text-rose-500">*</span>
          </label>
          <select
            value={playType}
            onChange={(e) => { setPlayType(e.target.value); setErrors((p) => ({ ...p, playType: false })); }}
            className={`${selectClass} ${errors.playType ? 'ring-2 ring-rose-400 border-rose-400' : ''}`}
          >
            <option value="">Select…</option>
            {playTypeOptions.map((l) => <option key={l.id} value={l.value}>{l.value}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Blitz <span className="text-rose-500">*</span>
          </label>
          <select
            value={blitz}
            onChange={(e) => { setBlitz(e.target.value); setErrors((p) => ({ ...p, blitz: false })); }}
            className={`${selectClass} ${errors.blitz ? 'ring-2 ring-rose-400 border-rose-400' : ''}`}
          >
            <option value="">Select…</option>
            {blitzOptions.map((l) => <option key={l.id} value={l.value}>{l.value}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Line stunt <span className="text-rose-500">*</span>
          </label>
          <select
            value={lineStunt}
            onChange={(e) => { setLineStunt(e.target.value); setErrors((p) => ({ ...p, lineStunt: false })); }}
            className={`${selectClass} ${errors.lineStunt ? 'ring-2 ring-rose-400 border-rose-400' : ''}`}
          >
            <option value="">Select…</option>
            {stuntOptions.map((l) => <option key={l.id} value={l.value}>{l.value}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
          <input type="checkbox" checked={favorite} onChange={() => setFavorite(!favorite)} className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
          Favorite
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
          <input type="checkbox" checked={active} onChange={() => setActive(!active)} className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
          Active
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2 transition active:scale-[0.98] cursor-pointer">
          {preset ? 'Save Changes' : 'Add Preset'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-5 py-2 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Preset Row ───────────────────────────────────────────────────────

function PresetRow({ preset, onEdit, onDelete, onToggleFavorite, onToggleActive, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`rounded-xl border p-3.5 transition ${preset.active ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-base">{preset.name}</span>
            {preset.favorite && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">★ Fav</span>
            )}
            {!preset.active && (
              <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">Inactive</span>
            )}
          </div>
          <div className="text-sm text-slate-600 mt-0.5">
            {preset.playType} · {preset.blitz} · {preset.lineStunt}
          </div>
        </div>

        {/* Reorder controls */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default cursor-pointer text-slate-500"
            title="Move up"
          >
            <ChevronUpIcon />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default cursor-pointer text-slate-500"
            title="Move down"
          >
            <ChevronDownIcon />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        <button
          onClick={onToggleFavorite}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
          title={preset.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <StarIcon filled={preset.favorite} />
          {preset.favorite ? 'Unfavorite' : 'Favorite'}
        </button>
        <button
          onClick={onToggleActive}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
            preset.active
              ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
          }`}
        >
          {preset.active ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          Edit
        </button>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Preset Manager ──────────────────────────────────────────────

export default function PresetManager() {
  const {
    presets,
    lookups,
    addNewPreset,
    editExistingPreset,
    deleteExistingPreset,
    toggleFavoritePreset,
    toggleActivePreset,
    movePresetOrder,
  } = useGame();

  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);

  const allPresets = useMemo(() => getAllPresets(presets), [presets]);

  const filteredPresets = useMemo(() => {
    switch (filter) {
      case 'Active': return allPresets.filter((p) => p.active);
      case 'Favorites': return allPresets.filter((p) => p.favorite);
      case 'Inactive': return allPresets.filter((p) => !p.active);
      default: return allPresets;
    }
  }, [allPresets, filter]);

  function handleAddPreset(data) {
    const ok = addNewPreset(data);
    if (ok) { setShowForm(false); }
  }

  function handleEditPreset(data) {
    const ok = editExistingPreset(editingPreset.id, data);
    if (ok) { setEditingPreset(null); }
  }

  function startEdit(preset) {
    setEditingPreset(preset);
    setShowForm(false);
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Preset Manager</h3>
            <p className="text-xs text-slate-500 mt-0.5">Add, edit, and organize call packages</p>
          </div>
          {!showForm && !editingPreset && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 transition active:scale-[0.98] cursor-pointer"
            >
              + Add Preset
            </button>
          )}
        </div>
      </div>

      <div className="p-4 pt-2 space-y-4">
        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
            <h4 className="font-semibold text-slate-900 mb-3">New preset</h4>
            <PresetForm lookups={lookups} onSave={handleAddPreset} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Edit form */}
        {editingPreset && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
            <h4 className="font-semibold text-slate-900 mb-3">Edit preset</h4>
            <PresetForm
              preset={editingPreset}
              lookups={lookups}
              onSave={handleEditPreset}
              onCancel={() => setEditingPreset(null)}
            />
          </div>
        )}

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition cursor-pointer ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
              {f === 'All' && <span className="ml-1 opacity-70">({allPresets.length})</span>}
              {f === 'Active' && <span className="ml-1 opacity-70">({allPresets.filter((p) => p.active).length})</span>}
              {f === 'Favorites' && <span className="ml-1 opacity-70">({allPresets.filter((p) => p.favorite).length})</span>}
              {f === 'Inactive' && <span className="ml-1 opacity-70">({allPresets.filter((p) => !p.active).length})</span>}
            </button>
          ))}
        </div>

        {/* Preset list */}
        <div className="space-y-2.5">
          {filteredPresets.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">
              {filter === 'All' ? 'No presets yet. Add your first preset above.' : `No ${filter.toLowerCase()} presets.`}
            </p>
          )}
          {filteredPresets.map((preset, idx) => (
            <PresetRow
              key={preset.id}
              preset={preset}
              isFirst={idx === 0}
              isLast={idx === filteredPresets.length - 1}
              onEdit={() => startEdit(preset)}
              onDelete={() => deleteExistingPreset(preset.id)}
              onToggleFavorite={() => toggleFavoritePreset(preset.id)}
              onToggleActive={() => toggleActivePreset(preset.id)}
              onMoveUp={() => movePresetOrder(preset.id, 'up')}
              onMoveDown={() => movePresetOrder(preset.id, 'down')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
