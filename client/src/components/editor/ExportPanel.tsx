import React from 'react';
import useEditorStore from '../../state/useEditorStore';

const ExportPanel: React.FC = () => {
  const { exportSettings, setExportFormat } = useEditorStore();
  const { format } = exportSettings;

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Export Settings</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-700">Format</label>
          <select
            id="format"
            value={format}
            onChange={(e) => setExportFormat(e.target.value as 'Original' | 'JPEG' | 'PNG' | 'WebP')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option>Original</option>
            <option>JPEG</option>
            <option>PNG</option>
            <option>WebP</option>
          </select>
        </div>
        {/* Target file size input will be added in a future step */}
      </div>
    </div>
  );
};

export default ExportPanel;