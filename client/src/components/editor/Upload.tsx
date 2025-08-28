import React, { useRef } from 'react';
import useEditorStore from '../../state/useEditorStore';

const MAX_FREE_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const Upload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openEditor, setErrorMessage } = useEditorStore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FREE_FILE_SIZE) {
        setErrorMessage('File size exceeds the 10MB limit for free users.');
        return;
      }
      openEditor(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
      >
        Single Image (Free)
      </button>
    </>
  );
};

export default Upload;