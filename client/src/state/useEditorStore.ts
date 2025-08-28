import { create } from 'zustand';

export interface EditorState {
  // UI State
  isEditorOpen: boolean;
  activeTab: 'resize' | 'crop' | 'export';
  isCropping: boolean;
  isLoading: boolean;
  errorMessage: string | null;

  // Image State
  originalFile: File | null;
  previewUrl: string | null;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;

  // Resize Settings
  resizeSettings: {
    mode: 'bySize' | 'asPercentage' | 'socialMedia';
    bySize: {
      width: number;
      height: number;
      lockAspectRatio: boolean;
    };
    asPercentage: {
      percentage: number;
      units: 'px' | 'in' | 'cm' | 'mm';
    };
    socialMedia: {
      platform: string;
      preset: string;
    };
  };

  // Export Settings
  exportSettings: {
    targetSize: {
      value: number | null;
      units: 'KB' | 'MB';
    };
    format: 'Original' | 'JPEG' | 'PNG' | 'WebP';
  };

  // Crop Settings
  cropSettings: {
    x: number;
    y: number;
    width: number;
    height: number;
    ratio: string | null;
  };

  // User State
  isPro: boolean;

  // Actions
  openEditor: (file: File) => void;
  closeEditor: () => void;
  setErrorMessage: (message: string | null) => void;
  setResizeWidth: (width: number) => void;
  setResizeHeight: (height: number) => void;
  toggleAspectRatioLock: () => void;
  setResizeMode: (mode: 'bySize' | 'asPercentage' | 'socialMedia') => void;
  setPercentage: (percentage: number) => void;
  setSocialPreset: (platform: string, preset: string, width: number, height: number) => void;
  setExportFormat: (format: 'Original' | 'JPEG' | 'PNG' | 'WebP') => void;
  setCrop: (crop: Partial<EditorState['cropSettings']>) => void;
  toggleIsCropping: () => void;
  exportImage: () => void;
}

const useEditorStore = create<EditorState>((set, get) => ({
  // Initial UI State
  isEditorOpen: false,
  activeTab: 'resize',
  isCropping: false,
  isLoading: false,
  errorMessage: null,

  // Initial Image State
  originalFile: null,
  previewUrl: null,
  originalWidth: 0,
  originalHeight: 0,
  outputWidth: 0,
  outputHeight: 0,

  // Initial Resize Settings
  resizeSettings: {
    mode: 'bySize',
    bySize: {
      width: 0,
      height: 0,
      lockAspectRatio: true,
    },
    asPercentage: {
      percentage: 100,
      units: 'px',
    },
    socialMedia: {
      platform: 'Facebook',
      preset: 'Post',
    },
  },

  // Initial Export Settings
  exportSettings: {
    targetSize: {
      value: null,
      units: 'KB',
    },
    format: 'Original',
  },

  // Initial Crop Settings
  cropSettings: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    ratio: null,
  },

  // Initial User State
  isPro: false,

  // Actions
  openEditor: (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        set({
          isEditorOpen: true,
          originalFile: file,
          previewUrl: e.target?.result as string,
          originalWidth: img.width,
          originalHeight: img.height,
          outputWidth: img.width,
          outputHeight: img.height,
          isLoading: false,
          resizeSettings: {
            ...get().resizeSettings,
            bySize: {
              ...get().resizeSettings.bySize,
              width: img.width,
              height: img.height,
            },
          },
          cropSettings: {
            ...get().cropSettings,
            width: img.width,
            height: img.height,
          },
        });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      set({ isLoading: false, errorMessage: 'Failed to read the image file.' });
    };
    set({ isLoading: true, errorMessage: null });
    reader.readAsDataURL(file);
  },

  closeEditor: () => set({
    isEditorOpen: false,
    originalFile: null,
    previewUrl: null,
    errorMessage: null,
  }),

  setErrorMessage: (message) => set({ errorMessage: message }),

  setResizeWidth: (width) => {
    const { resizeSettings, originalWidth, originalHeight } = get();
    if (resizeSettings.bySize.lockAspectRatio) {
      const aspectRatio = originalWidth / originalHeight;
      const height = Math.round(width / aspectRatio);
      set({
        resizeSettings: {
          ...resizeSettings,
          bySize: { ...resizeSettings.bySize, width, height },
        },
        outputWidth: width,
        outputHeight: height,
      });
    } else {
      set({
        resizeSettings: {
          ...resizeSettings,
          bySize: { ...resizeSettings.bySize, width },
        },
        outputWidth: width,
      });
    }
  },

  setResizeHeight: (height) => {
    const { resizeSettings, originalWidth, originalHeight } = get();
    if (resizeSettings.bySize.lockAspectRatio) {
      const aspectRatio = originalWidth / originalHeight;
      const width = Math.round(height * aspectRatio);
      set({
        resizeSettings: {
          ...resizeSettings,
          bySize: { ...resizeSettings.bySize, width, height },
        },
        outputWidth: width,
        outputHeight: height,
      });
    } else {
      set({
        resizeSettings: {
          ...resizeSettings,
          bySize: { ...resizeSettings.bySize, height },
        },
        outputHeight: height,
      });
    }
  },

  toggleAspectRatioLock: () => {
    const { resizeSettings } = get();
    set({
      resizeSettings: {
        ...resizeSettings,
        bySize: {
          ...resizeSettings.bySize,
          lockAspectRatio: !resizeSettings.bySize.lockAspectRatio,
        },
      },
    });
  },

  setResizeMode: (mode) => {
    set({
      resizeSettings: {
        ...get().resizeSettings,
        mode,
      },
    });
  },

  setPercentage: (percentage) => {
    const { originalWidth, originalHeight } = get();
    const newWidth = Math.round(originalWidth * (percentage / 100));
    const newHeight = Math.round(originalHeight * (percentage / 100));
    set({
      resizeSettings: {
        ...get().resizeSettings,
        asPercentage: {
          ...get().resizeSettings.asPercentage,
          percentage,
        },
        bySize: {
          ...get().resizeSettings.bySize,
          width: newWidth,
          height: newHeight,
        },
      },
      outputWidth: newWidth,
      outputHeight: newHeight,
    });
  },

  setSocialPreset: (platform, preset, width, height) => {
    set({
      resizeSettings: {
        ...get().resizeSettings,
        socialMedia: {
          platform,
          preset,
        },
        bySize: {
          ...get().resizeSettings.bySize,
          width,
          height,
        },
      },
      outputWidth: width,
      outputHeight: height,
    });
  },

  setExportFormat: (format) => {
    set({
      exportSettings: {
        ...get().exportSettings,
        format,
      },
    });
  },

  setCrop: (crop) => {
    set({
      cropSettings: {
        ...get().cropSettings,
        ...crop,
      },
    });
  },

  toggleIsCropping: () => {
    set({ isCropping: !get().isCropping });
  },

  exportImage: async () => {
    const state = get();
    const { processImage } = await import('../utils/imageProcessing');
    const blob = await processImage(state);

    if (blob) {
      const formData = new FormData();
      formData.append('image', blob);
      // In a real app, you would send this to the backend:
      // await fetch('/api/transform', { method: 'POST', body: formData });

      // For now, just download the client-processed image:
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resized-image.png';
      a.click();
      URL.revokeObjectURL(url);
    }
  },
}));

export default useEditorStore;