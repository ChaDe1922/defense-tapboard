import { useState, useMemo } from 'react';
import { useGame } from '../lib/GameContext';
import { getLookupsByType, LOOKUP_TYPES, LOOKUP_TYPE_LABELS } from '../lib/config-manager';

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition';

// ── Icons ────────────────────────────────────────────────────────────

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

// ── Lookup Row ───────────────────────────────────────────────────────

function LookupRow({ item, onEdit, onDelete, onToggleActive, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.value);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    if (editValue.trim() && editValue.trim() !== item.value) {
      const ok = onEdit(editValue.trim());
      if (ok) setEditing(false);
    } else {
      setEditing(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditing(false); setEditValue(item.value); }
  }

  return (
    <div className={`flex items-center gap-2 rounded-xl border p-3 transition ${
      item.active ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'
    }`}>
      {/* Reorder */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button onClick={onMoveUp} disabled={isFirst} className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default cursor-pointer text-slate-500" title="Move up">
          <ChevronUpIcon />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default cursor-pointer text-slate-500" title="Move down">
          <ChevronDownIcon />
        </button>
      </div>

      {/* Value */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className={inputClass}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 text-sm">{item.value}</span>
            {item.protected && (
              <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 uppercase tracking-wide">Required</span>
            )}
            {!item.active && (
              <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Inactive</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!item.protected && !editing && (
          <button
            onClick={() => { setEditValue(item.value); setEditing(true); }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Edit
          </button>
        )}

        {!item.protected && (
          <button
            onClick={() => onToggleActive()}
            className={`rounded-lg border px-2 py-1 text-xs font-medium transition cursor-pointer ${
              item.active
                ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {item.active ? 'Off' : 'On'}
          </button>
        )}

        {!item.protected && !item.required && (
          <>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                ×
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDelete(); setConfirmDelete(false); }}
                  className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  No
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Add Value Form ───────────────────────────────────────────────────

function AddValueForm({ onAdd, onCancel }) {
  const [value, setValue] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    const ok = onAdd(value.trim());
    if (ok) { setValue(''); onCancel(); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="New value…"
        autoFocus
        className={`${inputClass} flex-1`}
      />
      <button type="submit" className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 transition active:scale-[0.98] cursor-pointer whitespace-nowrap">
        Add
      </button>
      <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 bg-white text-slate-600 text-sm font-medium px-3 py-2 hover:bg-slate-50 transition cursor-pointer">
        Cancel
      </button>
    </form>
  );
}

// ── Main Lookup Manager ──────────────────────────────────────────────

export default function LookupManager() {
  const {
    lookups,
    addLookupValue,
    editLookupValue,
    deleteLookupValue,
    toggleLookupActiveValue,
    moveLookupOrder,
  } = useGame();

  const [activeTab, setActiveTab] = useState('play_type');
  const [showAdd, setShowAdd] = useState(false);

  const typeItems = useMemo(() => getLookupsByType(lookups, activeTab), [lookups, activeTab]);
  const activeCount = typeItems.filter((l) => l.active).length;

  function handleAdd(value) {
    return addLookupValue(activeTab, value);
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Lookup Manager</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage selectable values for entry fields</p>
          </div>
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 transition active:scale-[0.98] cursor-pointer"
            >
              + Add Value
            </button>
          )}
        </div>
      </div>

      <div className="p-4 pt-2 space-y-4">
        {/* Type tabs */}
        <div className="flex flex-wrap gap-1.5">
          {LOOKUP_TYPES.map((type) => {
            const count = getLookupsByType(lookups, type).length;
            return (
              <button
                key={type}
                onClick={() => { setActiveTab(type); setShowAdd(false); }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer ${
                  activeTab === type
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {LOOKUP_TYPE_LABELS[type]}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Status summary */}
        <div className="text-xs text-slate-500">
          {activeCount} active of {typeItems.length} total
          {activeTab === 'outcome' && (
            <span className="ml-2 text-violet-600 font-medium">· Required outcomes are protected</span>
          )}
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3">
            <AddValueForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />
          </div>
        )}

        {/* Items list */}
        <div className="space-y-2">
          {typeItems.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No values defined. Add your first value above.</p>
          )}
          {typeItems.map((item, idx) => (
            <LookupRow
              key={item.id}
              item={item}
              isFirst={idx === 0}
              isLast={idx === typeItems.length - 1}
              onEdit={(newVal) => editLookupValue(item.id, newVal)}
              onDelete={() => deleteLookupValue(item.id)}
              onToggleActive={() => toggleLookupActiveValue(item.id)}
              onMoveUp={() => moveLookupOrder(item.id, 'up')}
              onMoveDown={() => moveLookupOrder(item.id, 'down')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
