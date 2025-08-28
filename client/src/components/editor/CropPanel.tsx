import React from 'react';
import useEditorStore from '../../state/useEditorStore';

const CropPanel: React.FC = () => {
  const { cropSettings, setCrop } = useEditorStore();
  const { ratio } = cropSettings;

  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRatio = e.target.value;
    // Add logic here to adjust crop dimensions based on the new ratio
    setCrop({ ratio: newRatio });
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Crop</h3>
      <div>
        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
        <select
          id="aspectRatio"
          value={ratio || 'Freeform'}
          onChange={handleAspectRatioChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option>Freeform</option>
          <option>Original</option>
          <option>1:1</option>
          <option>4:3</option>
          <option>16:9</option>
          {/* Add other ratios from requirements */}
        </select>
      </div>
    </div>
  );
};

export default CropPanel;