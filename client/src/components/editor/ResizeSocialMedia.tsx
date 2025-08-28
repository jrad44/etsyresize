import React from 'react';
import useEditorStore from '../../state/useEditorStore';
import presets from '../../data/social-presets.json';

const ResizeSocialMedia: React.FC = () => {
  const { resizeSettings, setSocialPreset } = useEditorStore();
  const { platform, preset } = resizeSettings.socialMedia;

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlatform = e.target.value;
    const newPreset = Object.keys(presets[newPlatform as keyof typeof presets])[0];
    const { width, height } = presets[newPlatform as keyof typeof presets][newPreset as keyof typeof presets[keyof typeof presets]];
    setSocialPreset(newPlatform, newPreset, width, height);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPreset = e.target.value;
    const { width, height } = presets[platform as keyof typeof presets][newPreset as keyof typeof presets[keyof typeof presets]];
    setSocialPreset(platform, newPreset, width, height);
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <h4 className="text-md font-semibold mb-2">Social Media</h4>
      <div className="space-y-4">
        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-gray-700">Platform</label>
          <select
            id="platform"
            value={platform}
            onChange={handlePlatformChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {Object.keys(presets).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="preset" className="block text-sm font-medium text-gray-700">Preset</label>
          <select
            id="preset"
            value={preset}
            onChange={handlePresetChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {Object.keys(presets[platform as keyof typeof presets]).map((pr) => (
              <option key={pr} value={pr}>{pr}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ResizeSocialMedia;