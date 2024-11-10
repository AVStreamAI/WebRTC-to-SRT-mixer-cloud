import React from 'react';

interface StreamSettingsProps {
  streamNumber: number;
  settings: {
    latency: number;
    streamId: string;
    port: string | number;
    host: string;
    passphrase?: string;
    mode?: 'caller' | 'listener';
  };
  onSettingsChange: (streamNumber: number, settings: any) => void;
}

export function StreamSettings({ streamNumber, settings, onSettingsChange }: StreamSettingsProps) {
  const handleChange = (field: string, value: string | number) => {
    onSettingsChange(streamNumber, {
      ...settings,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">SRT Output Settings</h4>
      <div className="space-y-2">
        <div>
          <label className="block text-sm text-gray-600">Host</label>
          <input
            type="text"
            value={settings.host}
            placeholder="stream.server.com"
            onChange={(e) => handleChange('host', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Port</label>
          <input
            type="text"
            value={settings.port}
            placeholder="9000"
            onChange={(e) => handleChange('port', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Stream ID</label>
          <input
            type="text"
            value={settings.streamId}
            placeholder="my-stream"
            onChange={(e) => handleChange('streamId', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Passphrase</label>
          <input
            type="password"
            value={settings.passphrase || ''}
            onChange={(e) => handleChange('passphrase', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Mode</label>
          <select
            value={settings.mode || 'caller'}
            onChange={(e) => handleChange('mode', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="caller">Caller (Push)</option>
            <option value="listener">Listener (Pull)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Latency (ms)</label>
          <input
            type="number"
            value={settings.latency}
            onChange={(e) => handleChange('latency', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}