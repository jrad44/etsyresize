import React, { useEffect, useCallback } from 'react';
import CropCanvas from './components/CropCanvas';
import CropControls from './components/CropControls';
import useCropStore from './state/useCropStore';

interface CropModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CropModeModal: React.FC<CropModeModalProps> = ({ isOpen, onClose }) => {
  const { image, closeCropMode, nudgeCrop } = useCropStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    const largeStep = event.shiftKey;
    switch (event.key) {
      case 'ArrowUp':
        nudgeCrop('up', largeStep);
        event.preventDefault();
        break;
      case 'ArrowDown':
        nudgeCrop('down', largeStep);
        event.preventDefault();
        break;
      case 'ArrowLeft':
        nudgeCrop('left', largeStep);
        event.preventDefault();
        break;
      case 'ArrowRight':
        nudgeCrop('right', largeStep);
        event.preventDefault();
        break;
      case 'Escape':
        closeCropMode();
        event.preventDefault();
        break;
    }
  }, [isOpen, closeCropMode, nudgeCrop]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Set focus to the modal or a specific element within it for better a11y
      // For now, we'll just ensure the modal is generally focusable.
      // In a more complex scenario, you might manage focus within the modal.
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-5xl flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Crop Image</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-3xl leading-none">
            &times;
          </button>
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-gray-100 flex items-center justify-center min-h-[300px]">
            {image.url ? (
              <CropCanvas imageUrl={image.url} imageWidth={image.width} imageHeight={image.height} />
            ) : (
              <p className="text-gray-500">No image loaded for cropping.</p>
            )}
          </div>
          <div className="md:col-span-1">
            <CropControls />
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert('Apply Crop functionality will go here!');
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropModeModal;
