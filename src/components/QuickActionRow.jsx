import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/GameContext';

function ActionButton({ children, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 min-h-[48px] text-[0.9375rem] font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-all duration-150 active:scale-[0.97] cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}

export default function QuickActionRow({ onEditLast, onEndDrive }) {
  const navigate = useNavigate();
  const { repeatLast, undoLast, plays, showToast } = useGame();

  const handleEditLast = () => {
    const activePlays = plays.filter(p => !p.deleted);
    if (activePlays.length === 0) {
      showToast('No plays to edit', 1500);
      return;
    }
    const lastPlay = activePlays[activePlays.length - 1];
    onEditLast(lastPlay);
  };

  return (
    <div className="grid grid-cols-4 gap-2.5 px-2.5 md:px-4">
      <ActionButton onClick={repeatLast} ariaLabel="Repeat last play">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
          <path d="M21 12a9 9 0 0 0-15-6.7L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 15 6.7L21 16" />
          <path d="M16 16h5v5" />
        </svg>
        <span>Repeat</span>
      </ActionButton>
      <ActionButton onClick={undoLast} ariaLabel="Undo last play">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
          <path d="M3 7v6h6" />
          <path d="M21 17v-6h-6" />
          <path d="M7 13a7 7 0 0 0 11 4" />
          <path d="M17 11A7 7 0 0 0 6 7" />
        </svg>
        <span>Undo</span>
      </ActionButton>
      <ActionButton onClick={handleEditLast} ariaLabel="Edit last play">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <span>Edit</span>
      </ActionButton>
      <ActionButton onClick={() => navigate('/dashboard')} ariaLabel="View dashboard statistics">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
          <path d="M4 20V10" />
          <path d="M12 20V4" />
          <path d="M20 20v-6" />
        </svg>
        <span>Stats</span>
      </ActionButton>
    </div>
  );
}
