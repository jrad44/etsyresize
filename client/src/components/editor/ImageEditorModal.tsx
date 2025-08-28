import React from 'react';
import useEditorStore from '../../state/useEditorStore';
import CropPanel from './CropPanel';
import EditorCanvas from './EditorCanvas';
import ExportPanel from './ExportPanel';
import ResizePanel from './ResizePanel';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl: string | null;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, previewUrl }) => {
  const { isCropping, toggleIsCropping, exportImage } = useEditorStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-6xl flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Image Editor</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-3xl leading-none">
            &times;
          </button>
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-gray-100 flex items-center justify-center min-h-[400px]">
            {previewUrl && <EditorCanvas imageUrl={previewUrl} />}
          </div>
          <div className="md:col-span-1">
            <div className="bg-gray-50 border border-gray-200 h-full flex flex-col">
              {isCropping ? <CropPanel /> : <ResizePanel />}
              <ExportPanel />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <button
            onClick={toggleIsCropping}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            {isCropping ? 'Back to Resize' : 'Crop Image'}
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={exportImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Export Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;