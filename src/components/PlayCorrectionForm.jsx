/**
 * Phase 8: Play Correction Form
 * 
 * Reusable form for editing plays (Edit Last, Edit Recent).
 * Supports validation, managed lookups, and optional correction reason.
 */

import { useState, useEffect } from 'react';

export default function PlayCorrectionForm({
  play,
  managedPlayTypes,
  managedBlitzes,
  managedStunts,
  managedOutcomes,
  onSave,
  onCancel,
}) {
  const [playType, setPlayType] = useState(play.playType || '');
  const [blitz, setBlitz] = useState(play.blitz || '');
  const [lineStunt, setLineStunt] = useState(play.lineStunt || '');
  const [outcome, setOutcome] = useState(play.outcome || '');
  const [quarter, setQuarter] = useState(play.quarter || 'Q1');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setPlayType(play.playType || '');
    setBlitz(play.blitz || '');
    setLineStunt(play.lineStunt || '');
    setOutcome(play.outcome || '');
    setQuarter(play.quarter || 'Q1');
    setReason('');
  }, [play]);

  const validate = () => {
    const newErrors = {};
    
    if (!playType) newErrors.playType = 'Play type is required';
    if (!blitz) newErrors.blitz = 'Blitz is required';
    if (!lineStunt) newErrors.lineStunt = 'Line stunt is required';
    if (!outcome) newErrors.outcome = 'Outcome is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    onSave({
      playType,
      blitz,
      lineStunt,
      outcome,
      quarter,
      reason: reason.trim() || null,
    });
  };

  const hasChanges = 
    playType !== play.playType ||
    blitz !== play.blitz ||
    lineStunt !== play.lineStunt ||
    outcome !== play.outcome ||
    quarter !== play.quarter;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* Play Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Play Type
          </label>
          <select
            value={playType}
            onChange={(e) => setPlayType(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.playType ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
            }`}
          >
            <option value="">Select play type</option>
            {managedPlayTypes.map((pt) => (
              <option key={pt} value={pt}>{pt}</option>
            ))}
          </select>
          {errors.playType && (
            <p className="text-red-600 text-sm mt-1">{errors.playType}</p>
          )}
        </div>

        {/* Blitz */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Blitz
          </label>
          <select
            value={blitz}
            onChange={(e) => setBlitz(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.blitz ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
            }`}
          >
            <option value="">Select blitz</option>
            {managedBlitzes.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          {errors.blitz && (
            <p className="text-red-600 text-sm mt-1">{errors.blitz}</p>
          )}
        </div>

        {/* Line Stunt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Line Stunt
          </label>
          <select
            value={lineStunt}
            onChange={(e) => setLineStunt(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.lineStunt ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
            }`}
          >
            <option value="">Select line stunt</option>
            {managedStunts.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.lineStunt && (
            <p className="text-red-600 text-sm mt-1">{errors.lineStunt}</p>
          )}
        </div>

        {/* Outcome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Outcome
          </label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.outcome ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
            }`}
          >
            <option value="">Select outcome</option>
            {managedOutcomes.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {errors.outcome && (
            <p className="text-red-600 text-sm mt-1">{errors.outcome}</p>
          )}
        </div>

        {/* Quarter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quarter
          </label>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
            <option value="OT">OT</option>
          </select>
        </div>

        {/* Correction Reason (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correction Reason <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Wrong outcome tapped"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            maxLength={100}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`flex-1 px-4 py-2 rounded-lg font-medium ${
            hasChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Save Changes
        </button>
      </div>

      {!hasChanges && (
        <p className="text-sm text-gray-500 text-center">
          No changes made
        </p>
      )}
    </div>
  );
}
