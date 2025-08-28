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
  setAspectRatio: (ratio: string | null) => void;
  setZoomLevel: (level: number) => void;
  resetZoomPan: () => void;
  rotate: (direction: 'CW' | 'CCW') => void;
  flip: (axis: 'H' | 'V') => void;
}

const useCropStore = create<CropState>((set, get) => ({
  isCropModeOpen: false,
  image: {},
  crop: { x: 0, y: 0, width: 0, height: 0, ratio: null },
  view: { zoom: 1, pan: { x: 0, y: 0 }, grid: true, snap: true },
  transform: { rotation: 0, flipH: false, flipV: false },
  limits: { minCropPx: 10 },
  pro: { isPro: false, dailyFreeRemaining: 5 },

  openCropMode: (url, width, height) => {
    console.log('useCropStore: openCropMode called with:', { url, width, height });
    set({
      isCropModeOpen: true,
      image: { url, width: width || 800, height: height || 600 }, // Provide default dimensions if not available
      // Initialize crop to zero dimensions, CropCanvas will set it to scaled image size
      crop: { x: 0, y: 0, width: 0, height: 0, ratio: null },
    });
  },
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
  setAspectRatio: (ratio) => set((state) => {
    const { crop, image } = state;
    let newWidth = crop.width;
    let newHeight = crop.height;

    if (ratio === 'Free') {
      return { crop: { ...crop, ratio: null } };
    }

    const [ratioW, ratioH] = ratio!.split(':').map(Number);
    const currentRatio = crop.width / crop.height;
    const targetRatio = ratioW / ratioH;

    if (currentRatio > targetRatio) { // Current is wider than target, adjust width
      newWidth = crop.height * targetRatio;
    } else { // Current is taller than target, adjust height
      newHeight = crop.width / targetRatio;
    }

    // Recenter the crop box
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;

    let newX = centerX - newWidth / 2;
    let newY = centerY - newHeight / 2;

    // Clamp to image bounds
    newX = Math.max(0, Math.min(newX, (image.width || 0) - newWidth));
    newY = Math.max(0, Math.min(newY, (image.height || 0) - newHeight));

    return { crop: { ...crop, x: newX, y: newY, width: newWidth, height: newHeight, ratio } };
  }),
  setZoomLevel: (level: number) => set((state) => ({ view: { ...state.view, zoom: level } })),
  resetZoomPan: () => set((state) => ({ view: { ...state.view, zoom: 1, pan: { x: 0, y: 0 } } })),
  rotate: (direction) => set((state) => {
    const currentRotation = state.transform.rotation;
    let newRotation = currentRotation;
    if (direction === 'CW') {
      newRotation = (currentRotation + 90) % 360;
    } else {
      newRotation = (currentRotation - 90 + 360) % 360;
    }
    // TODO: Reproject crop to new coordinates
    return { transform: { ...state.transform, rotation: newRotation } };
  }),
  flip: (axis) => set((state) => {
    if (axis === 'H') {
      return { transform: { ...state.transform, flipH: !state.transform.flipH } };
    } else {
      return { transform: { ...state.transform, flipV: !state.transform.flipV } };
    }
  }),
}));

export default useCropStore;
