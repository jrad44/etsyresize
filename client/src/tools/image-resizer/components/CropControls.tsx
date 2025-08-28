import React from 'react';
import useCropStore from '../state/useCropStore';

const CropControls: React.FC = () => {
  const { crop, view, toggleGrid, setCrop, setAspectRatio, image, limits, setZoomLevel, resetZoomPan, rotate, flip } = useCropStore();

  const clampCropDimension = (value: number, currentPos: number, maxImageDim: number, minCrop: number) => {
    return Math.max(minCrop, Math.min(value, maxImageDim - currentPos));
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Crop Controls</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
          <select
            id="aspectRatio"
            name="aspectRatio"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            aria-label="Select aspect ratio for cropping"
            value={crop.ratio || 'Free'}
            onChange={(e) => setAspectRatio(e.target.value)}
          >
            <option>Free</option>
            <option>1:1</option>
            <option>4:3</option>
            <option>3:2</option>
            <option>16:9</option>
            <option>9:16</option>
            <option>5:4</option>
          </select>
        </div>
        <div>
          <label htmlFor="width" className="block text-sm font-medium text-gray-700">Width (px)</label>
          <input
            type="number"
            id="width"
            name="width"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Auto"
            aria-label="Crop width in pixels"
            value={Math.round(crop.width)}
            onChange={(e) => {
              const newWidth = Number(e.target.value);
              if (!isNaN(newWidth)) {
                let newHeight = crop.height;
                if (crop.ratio && crop.ratio !== 'Free') {
                  const [ratioW, ratioH] = crop.ratio.split(':').map(Number);
                  newHeight = newWidth / (ratioW / ratioH);
                }
                setCrop({ width: newWidth, height: newHeight });
              }
            }}
            onBlur={(e) => {
              let newWidth = Number(e.target.value);
              let newHeight = crop.height;
              if (crop.ratio && crop.ratio !== 'Free') {
                const [ratioW, ratioH] = crop.ratio.split(':').map(Number);
                newHeight = newWidth / (ratioW / ratioH);
              }

              const maxAllowedWidth = (image.width || 0) - crop.x;
              const maxAllowedHeight = (image.height || 0) - crop.y;

              newWidth = clampCropDimension(newWidth, crop.x, image.width || 0, limits.minCropPx);
              newHeight = clampCropDimension(newHeight, crop.y, image.height || 0, limits.minCropPx);

              if (crop.ratio && crop.ratio !== 'Free') {
                const [ratioW, ratioH] = crop.ratio.split(':').map(Number);
                const currentRatio = newWidth / newHeight;
                const targetRatio = ratioW / ratioH;

                if (currentRatio > targetRatio) {
                  newWidth = newHeight * targetRatio;
                } else {
                  newHeight = newWidth / targetRatio;
                }
              }
              setCrop({ width: newWidth, height: newHeight });
            }}
          />
        </div>
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (px)</label>
          <input
            type="number"
            id="height"
            name="height"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Auto"
            aria-label="Crop height in pixels"
            value={Math.round(crop.height)}
            onChange={(e) => {
              const newHeight = Number(e.target.value);
              if (!isNaN(newHeight)) {
                let newWidth = crop.width;
                if (crop.ratio && crop.ratio !== 'Free') {
                  const [ratioW, ratioH] = crop.ratio.split(':').map(Number);
                  newWidth = newHeight * (ratioW / ratioH);
                }
                setCrop({ width: newWidth, height: newHeight });
              }
            }}
            onBlur={(e) => {
              let newHeight = Number(e.target.value);
              let newWidth = crop.width;
              if (crop.ratio && crop.ratio !== 'Free') {
                const [ratioW, ratioH] = crop.ratio.split(':').map(Number);
                newWidth = newHeight * (ratioW / ratioH);
              }

              const maxAllowedWidth = (image.width || 0) - crop.x;
              const maxAllowedHeight = (image.height || 0) - crop.y;

              newWidth = clampCropDimension(newWidth, crop.x, image.width || 0, limits.minCropPx);
              newHeight = clampCropDimension(newHeight, crop.y, image.height || 0, limits.minCropPx);

              if (crop.ratio && crop.ratio !== 'Free') {
                const [ratioW, ratioH] = crop.ratio.split(':').map(Number);
                const currentRatio = newWidth / newHeight;
                const targetRatio = ratioW / ratioH;

                if (currentRatio > targetRatio) {
                  newWidth = newHeight * targetRatio;
                } else {
                  newHeight = newWidth / targetRatio;
                }
              }
              setCrop({ width: newWidth, height: newHeight });
            }}
          />
        </div>
        <div>
          <label htmlFor="xPos" className="block text-sm font-medium text-gray-700">X (px)</label>
          <input
            type="number"
            id="xPos"
            name="xPos"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="0"
            aria-label="Crop X position in pixels"
            value={Math.round(crop.x)}
            onChange={(e) => {
              const newX = Number(e.target.value);
              if (!isNaN(newX)) {
                setCrop({ x: newX });
              }
            }}
            onBlur={(e) => {
              let newX = Number(e.target.value);
              const maxAllowedX = (image.width || 0) - crop.width;
              newX = Math.max(0, Math.min(newX, maxAllowedX));
              setCrop({ x: newX });
            }}
          />
        </div>
        <div>
          <label htmlFor="yPos" className="block text-sm font-medium text-gray-700">Y (px)</label>
          <input
            type="number"
            id="yPos"
            name="yPos"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="0"
            aria-label="Crop Y position in pixels"
            value={Math.round(crop.y)}
            onChange={(e) => {
              const newY = Number(e.target.value);
              if (!isNaN(newY)) {
                setCrop({ y: newY });
              }
            }}
            onBlur={(e) => {
              let newY = Number(e.target.value);
              const maxAllowedY = (image.height || 0) - crop.height;
              newY = Math.max(0, Math.min(newY, maxAllowedY));
              setCrop({ y: newY });
            }}
          />
        </div>
        <div className="col-span-2 flex justify-around mt-2">
          <button onClick={() => rotate('CCW')} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" aria-label="Rotate counter-clockwise">Rotate L</button>
          <button onClick={() => rotate('CW')} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" aria-label="Rotate clockwise">Rotate R</button>
          <button onClick={() => flip('H')} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" aria-label="Flip image horizontally">Flip H</button>
          <button onClick={() => flip('V')} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" aria-label="Flip image vertically">Flip V</button>
          <button
            onClick={toggleGrid}
            className={`px-3 py-2 rounded-md ${view.grid ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            aria-pressed={view.grid}
            aria-label="Toggle rule of thirds grid"
          >
            Grid
          </button>
        </div>
        <div className="col-span-2 flex items-center justify-center space-x-2 mt-2">
          <button onClick={() => setZoomLevel(view.zoom / 1.2)} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">-</button>
          <button onClick={() => resetZoomPan()} className="px-4 py-1 bg-gray-200 rounded-md hover:bg-gray-300">{Math.round(view.zoom * 100)}%</button>
          <button onClick={() => setZoomLevel(view.zoom * 1.2)} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">+</button>
          <button onClick={() => resetZoomPan()} className="px-4 py-1 bg-gray-200 rounded-md hover:bg-gray-300">Fit</button>
          <button onClick={() => setZoomLevel(1)} className="px-4 py-1 bg-gray-200 rounded-md hover:bg-gray-300">1:1</button>
        </div>
        <div aria-live="polite" className="sr-only">
          {`Current crop dimensions: ${Math.round(crop.width)} by ${Math.round(crop.height)} pixels.`}
        </div>
      </div>
    </div>
  );
};

export default CropControls;
