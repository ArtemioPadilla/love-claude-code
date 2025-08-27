import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  Code2,
  Settings
} from 'lucide-react';
import { useConstructStore } from '../../stores/constructStore';
import { sandboxExecute } from '../../services/sandbox/constructSandbox';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DevicePreset {
  width: number;
  height: number;
  scale: number;
}

const devicePresets: Record<DeviceType, DevicePreset> = {
  mobile: { width: 375, height: 667, scale: 0.75 },
  tablet: { width: 768, height: 1024, scale: 0.5 },
  desktop: { width: 1366, height: 768, scale: 0.5 }
};

export const PreviewPanel: React.FC = () => {
  const { currentConstruct, previewProps, updatePreviewProps } = useConstructStore();
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [showPropsEditor, setShowPropsEditor] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const renderPreview = useCallback(async () => {
    if (!currentConstruct?.implementation) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await sandboxExecute({
        code: currentConstruct.implementation,
        props: previewProps,
        constructName: currentConstruct.metadata.name
      });

      if (result.error) {
        setError(result.error);
      } else {
        setPreviewHtml(result.html || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render preview');
    } finally {
      setIsLoading(false);
    }
  }, [currentConstruct, previewProps]);

  useEffect(() => {
    if (currentConstruct?.implementation) {
      renderPreview();
    }
  }, [currentConstruct?.implementation, previewProps, renderPreview]);

  const handleRefresh = () => {
    renderPreview();
  };

  const handlePropsChange = (newProps: Record<string, any>) => {
    updatePreviewProps(newProps);
  };

  const currentPreset = devicePresets[device];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Preview</h3>
          <div className="flex items-center space-x-2">
            {/* Device Selector */}
            <div className="flex rounded-md overflow-hidden">
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1.5 transition-colors ${
                  device === 'mobile'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Mobile view"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevice('tablet')}
                className={`p-1.5 transition-colors ${
                  device === 'tablet'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Tablet view"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevice('desktop')}
                className={`p-1.5 transition-colors ${
                  device === 'desktop'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Desktop view"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRefresh}
              className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              title="Refresh preview"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCode(!showCode)}
              className={`p-1.5 rounded transition-colors ${
                showCode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Show generated code"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPropsEditor(!showPropsEditor)}
              className={`p-1.5 rounded transition-colors ${
                showPropsEditor
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Edit props"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Props Editor */}
      {showPropsEditor && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gray-800/50 border-b border-gray-700 p-4"
        >
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Component Props</h4>
            <textarea
              value={JSON.stringify(previewProps, null, 2)}
              onChange={(e) => {
                try {
                  const newProps = JSON.parse(e.target.value);
                  handlePropsChange(newProps);
                } catch {
                  // Ignore JSON parse errors - user may be typing
                }
              }}
              className="w-full h-32 p-2 bg-gray-800 text-gray-100 rounded border border-gray-700 font-mono text-sm"
              placeholder="{}\n\nEdit props as JSON"
            />
          </div>
        </motion.div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-950 p-8">
        <div className="flex items-center justify-center h-full">
          {isLoading ? (
            <div className="text-gray-400">Rendering preview...</div>
          ) : error ? (
            <div className="text-red-400 text-center max-w-md">
              <p className="font-medium mb-2">Preview Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : showCode ? (
            <div className="w-full h-full">
              <pre className="bg-gray-800 p-4 rounded-lg overflow-auto h-full">
                <code className="text-gray-300 text-sm">{previewHtml}</code>
              </pre>
            </div>
          ) : (
            <motion.div
              key={device}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{
                width: currentPreset.width,
                height: currentPreset.height,
                transform: `scale(${currentPreset.scale})`
              }}
            >
              {/* Device Frame */}
              <div className="absolute inset-0 pointer-events-none">
                {device === 'mobile' && (
                  <>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-2xl" />
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full" />
                  </>
                )}
                {device === 'tablet' && (
                  <div className="absolute inset-0 border-8 border-black rounded-lg" />
                )}
              </div>

              {/* Content */}
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                title="Component Preview"
                sandbox="allow-scripts"
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};