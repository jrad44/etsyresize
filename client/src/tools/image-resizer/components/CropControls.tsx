import React from 'react';
import useCropStore from '../state/useCropStore';

const CropControls: React.FC = () => {
  const { crop, view, toggleGrid } = useCropStore();

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
          >
            <option>Free</option>
            <option>1:1 (Square)</option>
            <option>16:9 (Widescreen)</option>
            <option>4:3 (Standard)</option>
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
            readOnly // For now, input is read-only, will be interactive later
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
            readOnly // For now, input is read-only, will be interactive later
          />
        </div>
        <div className="col-span-2 flex justify-around mt-2">
          <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" aria-label="Rotate image">Rotate</button>
          <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" aria-label="Flip image horizontally">Flip H</button>
          <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" aria-label="Flip image vertically">Flip V</button>
          <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" aria-label="Zoom in or out">Zoom</button>
          <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" aria-label="Pan image">Pan</button>
          <button
            onClick={toggleGrid}
            className={`px-3 py-2 rounded-md ${view.grid ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            aria-pressed={view.grid}
            aria-label="Toggle rule of thirds grid"
          >
            Grid
          </button>
        </div>
        <div aria-live="polite" className="sr-only">
          {`Current crop dimensions: ${Math.round(crop.width)} by ${Math.round(crop.height)} pixels.`}
        </div>
      </div>
    </div>
  );
};

export default CropControls;
