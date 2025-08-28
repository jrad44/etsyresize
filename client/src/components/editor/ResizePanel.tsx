import React from 'react';
import useEditorStore from '../../state/useEditorStore';
import ResizeBySize from './ResizeBySize';
import ResizeAsPercentage from './ResizeAsPercentage';
import ResizeSocialMedia from './ResizeSocialMedia';

const ResizePanel: React.FC = () => {
  const { resizeSettings, setResizeMode } = useEditorStore();

  const renderContent = () => {
    switch (resizeSettings.mode) {
      case 'bySize':
        return <ResizeBySize />;
      case 'asPercentage':
        return <ResizeAsPercentage />;
      case 'socialMedia':
        return <ResizeSocialMedia />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Resize</h3>
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setResizeMode('bySize')}
            className={`px-4 py-2 text-sm font-medium ${resizeSettings.mode === 'bySize' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            By Size
          </button>
          <button
            onClick={() => setResizeMode('asPercentage')}
            className={`px-4 py-2 text-sm font-medium ${resizeSettings.mode === 'asPercentage' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            As Percentage
          </button>
          <button
            onClick={() => setResizeMode('socialMedia')}
            className={`px-4 py-2 text-sm font-medium ${resizeSettings.mode === 'socialMedia' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Social Media
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default ResizePanel;