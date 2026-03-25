import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/GameContext';

function ActionButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
    >
      {children}
    </button>
  );
}

export default function QuickActionRow({ onEditLast }) {
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
    <div className="grid grid-cols-4 gap-2 px-4 md:px-6">
      <ActionButton onClick={repeatLast}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M21 12a9 9 0 0 0-15-6.7L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 15 6.7L21 16" />
          <path d="M16 16h5v5" />
        </svg>
        Repeat
      </ActionButton>
      <ActionButton onClick={undoLast}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M3 7v6h6" />
          <path d="M21 17v-6h-6" />
          <path d="M7 13a7 7 0 0 0 11 4" />
          <path d="M17 11A7 7 0 0 0 6 7" />
        </svg>
        Undo
      </ActionButton>
      <ActionButton onClick={handleEditLast}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit
      </ActionButton>
      <ActionButton onClick={() => navigate('/dashboard')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M4 20V10" />
          <path d="M12 20V4" />
          <path d="M20 20v-6" />
        </svg>
        Stats
      </ActionButton>
    </div>
  );
}
