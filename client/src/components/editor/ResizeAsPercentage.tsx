import React from 'react';
import useEditorStore from '../../state/useEditorStore';

const ResizeAsPercentage: React.FC = () => {
  const { resizeSettings, setPercentage } = useEditorStore();
  const { percentage } = resizeSettings.asPercentage;

  return (
    <div className="p-4 border-t border-gray-200">
      <h4 className="text-md font-semibold mb-2">As Percentage</h4>
      <div className="flex items-center space-x-4">
        <input
          type="range"
          min="1"
          max="200"
          value={percentage}
          onChange={(e) => setPercentage(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-700">{percentage}%</span>
      </div>
      {/* Unit selector will be added in a future step */}
    </div>
  );
};

export default ResizeAsPercentage;