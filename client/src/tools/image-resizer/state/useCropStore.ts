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
  resetZoomPan: () => set((state) => ({ view: { ...state.view, zoom: 1, pan: { x: 0, y: 0 } } })),
  rotate: (direction) => set((state) => {
    const { crop, image, transform } = state;
    const currentRotation = transform.rotation;
    let newRotation = currentRotation;

    if (direction === 'CW') {
      newRotation = (currentRotation + 90) % 360;
    } else {
      newRotation = (currentRotation - 90 + 360) % 360;
    }

    // If image dimensions are not available, or crop is not initialized, just update rotation
    if (!image.width || !image.height || crop.width === 0 || crop.height === 0) {
      return { transform: { ...transform, rotation: newRotation } };
    }

    const imageWidth = image.width;
    const imageHeight = image.height;

    // Calculate the center of the image
    const imageCenterX = imageWidth / 2;
    const imageCenterY = imageHeight / 2;

    // Calculate the center of the current crop box
    const cropCenterX = crop.x + crop.width / 2;
    const cropCenterY = crop.y + crop.height / 2;

    // Translate crop center to origin, rotate, then translate back
    const translatedX = cropCenterX - imageCenterX;
    const translatedY = cropCenterY - imageCenterY;

    const angleRad = (newRotation * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;

    const newCropCenterX = rotatedX + imageCenterX;
    const newCropCenterY = rotatedY + imageCenterY;

    let newCropWidth = crop.width;
    let newCropHeight = crop.height;

    // If rotating by 90 or 270 degrees, swap width and height
    if (newRotation === 90 || newRotation === 270 || newRotation === -90 || newRotation === -270) {
      newCropWidth = crop.height;
      newCropHeight = crop.width;
    }

    // Calculate new top-left corner
    let newX = newCropCenterX - newCropWidth / 2;
    let newY = newCropCenterY - newCropHeight / 2;

    // Ensure crop stays within image bounds after rotation
    newX = Math.max(0, Math.min(newX, imageWidth - newCropWidth));
    newY = Math.max(0, Math.min(newY, imageHeight - newCropHeight));

    return {
      crop: { ...crop, x: newX, y: newY, width: newCropWidth, height: newCropHeight },
      transform: { ...transform, rotation: newRotation },
    };
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
