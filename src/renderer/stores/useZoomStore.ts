import { create } from 'zustand';

const ZOOM_LEVELS = [70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125];

interface ZoomState {
  zoom: number; // percentage (e.g. 75, 80, 85, 90, 100)
  setZoom: (percent: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  initZoom: () => () => void;
}

function getInitialZoom(): number {
  try {
    const saved = localStorage.getItem('zabad_pos_zoom');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && ZOOM_LEVELS.includes(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  // If running on a smaller laptop screen (<= 1366px width or <= 800px height),
  // default to 85% so POS cart and catalog fit comfortably
  if (typeof window !== 'undefined' && (window.innerWidth <= 1366 || window.innerHeight <= 800)) {
    return 85;
  }

  return 100;
}

function applyZoomToSystem(percent: number) {
  const factor = percent / 100;
  if (window.api?.setZoomFactor) {
    try {
      window.api.setZoomFactor(factor);
    } catch {
      // fallback
    }
  } else if (typeof document !== 'undefined') {
    try {
      (document.documentElement.style as any).zoom = `${percent}%`;
    } catch {
      // fallback
    }
  }
  try {
    localStorage.setItem('zabad_pos_zoom', String(percent));
  } catch {
    // fallback
  }
}

export const useZoomStore = create<ZoomState>((set, get) => ({
  zoom: getInitialZoom(),

  setZoom: (percent: number) => {
    const clamped = Math.min(125, Math.max(70, percent));
    applyZoomToSystem(clamped);
    set({ zoom: clamped });
  },

  zoomIn: () => {
    const current = get().zoom;
    const next = ZOOM_LEVELS.find((lvl) => lvl > current) ?? current;
    get().setZoom(next);
  },

  zoomOut: () => {
    const current = get().zoom;
    const prev = [...ZOOM_LEVELS].reverse().find((lvl) => lvl < current) ?? current;
    get().setZoom(prev);
  },

  resetZoom: () => {
    get().setZoom(100);
  },

  initZoom: () => {
    const currentZoom = get().zoom;
    applyZoomToSystem(currentZoom);

    // Global keyboard shortcuts: Ctrl + Minus, Ctrl + Plus, Ctrl + 0
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          get().zoomOut();
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          get().zoomIn();
        } else if (e.key === '0') {
          e.preventDefault();
          get().resetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  },
}));
