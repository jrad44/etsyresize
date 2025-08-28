import React, { useState } from 'react';
import './App.css'; // Keep for now, will be replaced by Tailwind
import CropModeModal from './tools/image-resizer/CropModeModal';
import useCropStore from './tools/image-resizer/state/useCropStore';

function App() {
  const [activeTool, setActiveTool] = useState('Image Resizer'); // State for active tool
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu
  const { isCropModeOpen, image, openCropMode, closeCropMode, nudgeCrop } = useCropStore();

  // Placeholder for Pro status
  const isProUser = false; // This will be fetched from the backend later

  const handleCropClick = () => {
    // For now, use a dummy image URL. In a real scenario, this would be the uploaded image.
    openCropMode('https://via.placeholder.com/800x600', 800, 600);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Global Navigation Bar */}
      <nav className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="font-bold text-lg">ResizedImage</div>
        <button
          className="md:hidden text-2xl"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>
        <ul className={`absolute md:static top-16 left-0 right-0 bg-white shadow-md md:shadow-none flex flex-col md:flex-row md:items-center md:space-x-4 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
          <li>
            <a
              href="#"
              className={`block py-2 px-4 ${activeTool === 'Image Resizer' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-500'}`}
              onClick={() => setActiveTool('Image Resizer')}
            >
              Image Resizer
            </a>
          </li>
          <li>
            <a
              href="#"
              className={`block py-2 px-4 ${activeTool === 'PDF Tool' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-500'}`}
              onClick={() => setActiveTool('PDF Tool')}
            >
              PDF Tool
            </a>
          </li>
          <li>
            <a
              href="#"
              className={`block py-2 px-4 ${activeTool === 'Background Remover' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-500'}`}
              onClick={() => setActiveTool('Background Remover')}
            >
              Background Remover
            </a>
          </li>
        </ul>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 ml-4">
          Unlock Pro ($2)
        </button>
      </nav>

      <main className="container mx-auto p-4">
        {activeTool === 'Image Resizer' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Image Resizer</h1>
            <p className="mb-4">
              Instantly resize your product photos to fit popular marketplaces like Amazon, Etsy, Shopify and more.
            </p>
            {/* Placeholder for image upload and resize controls */}
            <div className="border-2 border-dashed border-gray-300 p-8 text-center">
              Drag & Drop or Click to Upload Image
            </div>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              Process & Download
            </button>
            <button
              className="mt-4 ml-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
              onClick={handleCropClick}
            >
              Crop Image
            </button>
            {/* Add a placeholder for the Pro button here if needed, or integrate into header */}
          </div>
        )}
        {activeTool === 'PDF Tool' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">PDF Tool</h1>
            <p>PDF Tool content coming soon.</p>
          </div>
        )}
        {activeTool === 'Background Remover' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Background Remover</h1>
            <p>Background Remover content coming soon.</p>
          </div>
        )}
      </main>

      <CropModeModal isOpen={isCropModeOpen} onClose={closeCropMode} />
    </div>
  );
}

export default App
