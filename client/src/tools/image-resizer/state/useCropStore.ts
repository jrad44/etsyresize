import { create } from 'zustand';

interface CropState {
  isCropModeOpen: boolean;
  image: { url?: string; width?: number; height?: number };
  crop: { x: number; y: number; width: number; height: number; ratio?: string | null };
  view: { zoom: number; pan: { x: number; y: number }; grid: boolean; snap: boolean };
  transform: { rotation: number; flipH: boolean; flipV: boolean };
  limits: { minCropPx: number };
  pro: { isPro: boolean; dailyFreeRemaining: number };
  
  openCropMode: (url: string, width?: number, height?: number) => void;
  closeCropMode: () => void;
  setCrop: (crop: Partial<CropState['crop']>) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Partial<CropState['view']['pan']>) => void;
  setRotation: (rotation: number) => void;
  setFlipH: (flipH: boolean) => void;
  setFlipV: (flipV: boolean) => void;
  toggleGrid: () => void;
  nudgeCrop: (direction: 'up' | 'down' | 'left' | 'right', largeStep?: boolean) => void;
  setProStatus: (isPro: boolean) => void;
  setDailyFreeRemaining: (count: number) => void;
}

const useCropStore = create<CropState>((set, get) => ({
  isCropModeOpen: false,
  image: {},
  crop: { x: 0, y: 0, width: 0, height: 0, ratio: null },
  view: { zoom: 1, pan: { x: 0, y: 0 }, grid: true, snap: true },
  transform: { rotation: 0, flipH: false, flipV: false },
  limits: { minCropPx: 10 },
  pro: { isPro: false, dailyFreeRemaining: 5 },

  openCropMode: (url, width, height) => set({
    isCropModeOpen: true,
    image: { url, width, height },
    // Initialize crop to full image or a default square
    crop: { x: 0, y: 0, width: width || 0, height: height || 0, ratio: null },
  }),
  closeCropMode: () => set({
    isCropModeOpen: false,
    image: {},
    crop: { x: 0, y: 0, width: 0, height: 0, ratio: null },
    view: { zoom: 1, pan: { x: 0, y: 0 }, grid: true, snap: true },
    transform: { rotation: 0, flipH: false, flipV: false },
  }),
  setCrop: (newCrop) => set((state) => ({ crop: { ...state.crop, ...newCrop } })),
  setZoom: (zoom) => set((state) => ({ view: { ...state.view, zoom } })),
  setPan: (newPan) => set((state) => ({ view: { ...state.view, pan: { ...state.view.pan, ...newPan } } })),
  setRotation: (rotation) => set((state) => ({ transform: { ...state.transform, rotation } })),
  setFlipH: (flipH) => set((state) => ({ transform: { ...state.transform, flipH } })),
  setFlipV: (flipV) => set((state) => ({ transform: { ...state.transform, flipV } })),
  toggleGrid: () => set((state) => ({ view: { ...state.view, grid: !state.view.grid } })),
  nudgeCrop: (direction, largeStep = false) => {
    set((state) => {
      const step = largeStep ? 10 : 1;
      let { x, y, width, height } = state.crop;
      const { image } = state;

      // Clamp x, y to image bounds
      const maxX = (image.width || 0) - width;
      const maxY = (image.height || 0) - height;

      switch (direction) {
        case 'up':
          y = Math.max(0, y - step);
          break;
        case 'down':
          y = Math.min(maxY, y + step);
          break;
        case 'left':
          x = Math.max(0, x - step);
          break;
        case 'right':
          x = Math.min(maxX, x + step);
          break;
      }
      return { crop: { ...state.crop, x, y, width, height } };
    });
  },
  setProStatus: (isPro) => set((state) => ({ pro: { ...state.pro, isPro } })),
  setDailyFreeRemaining: (count) => set((state) => ({ pro: { ...state.pro, dailyFreeRemaining: count } })),
}));

export default useCropStore;
