import { useState } from 'react';
import ImageEditorModal from './components/editor/ImageEditorModal';
import Upload from './components/editor/Upload';
import useEditorStore from './state/useEditorStore';

function App() {
  const [activeTool, setActiveTool] = useState('Image Resizer'); // State for active tool
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu
  const { isEditorOpen, closeEditor, previewUrl, isLoading, errorMessage, setErrorMessage } = useEditorStore();

  // Placeholder for Pro status
  const _isProUser = false; // This will be fetched from the backend later

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
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h1 className="text-3xl font-bold mb-2">Image Resizer</h1>
            <p className="mb-6 text-gray-600">
              Resize, crop, and export images for any platform.
            </p>
            <div className="flex justify-center space-x-4">
              <Upload />
              <button
                onClick={() => alert('Pro feature coming soon!')}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
              >
                Batch Upload (Pro)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">Max file size: 10MB</p>
          </div>
        )}
        {errorMessage && (
          <div className="fixed top-20 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} className="absolute top-1 right-1 text-white">&times;</button>
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

      {isLoading && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <p className="text-white text-lg">Loading...</p>
        </div>
      )}
      <ImageEditorModal isOpen={isEditorOpen} onClose={closeEditor} previewUrl={previewUrl} />
    </div>
  );
}

export default App;
