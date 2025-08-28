import React from 'react';
import useEditorStore from '../../state/useEditorStore';

const ResizeBySize: React.FC = () => {
  const {
    resizeSettings,
    setResizeWidth,
    setResizeHeight,
    toggleAspectRatioLock,
  } = useEditorStore();

  const { width, height, lockAspectRatio } = resizeSettings.bySize;

  return (
    <div className="p-4 border-t border-gray-200">
      <h4 className="text-md font-semibold mb-2">By Size</h4>
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <label htmlFor="width" className="block text-sm font-medium text-gray-700">Width</label>
          <input
            type="number"
            id="width"
            value={Math.round(width)}
            onChange={(e) => setResizeWidth(parseInt(e.target.value, 10))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height</label>
          <input
            type="number"
            id="height"
            value={Math.round(height)}
            onChange={(e) => setResizeHeight(parseInt(e.target.value, 10))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <button
          onClick={toggleAspectRatioLock}
          className={`mt-6 p-2 rounded-md ${lockAspectRatio ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          aria-label="Toggle aspect ratio lock"
        >
          {lockAspectRatio ? '🔒' : '🔓'}
        </button>
      </div>
    </div>
  );
};

export default ResizeBySize;