import React, { useState } from 'react';
import {
  X,
  Upload,
  FileCode,
  Info,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Package,
  Shield,
  Tag,
  GitBranch,
  Globe,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConstructLevel } from '../../constructs/types';

interface PublishModalProps {
  onClose: () => void;
}

type PublishStep = 'upload' | 'metadata' | 'pricing' | 'review';

interface ConstructData {
  files: File[];
  name: string;
  description: string;
  level: ConstructLevel | '';
  category: string;
  icon: string;
  version: string;
  tags: string[];
  providers: string[];
  dependencies: string[];
  license: string;
  pricing: 'free' | 'paid';
  price?: number;
  readme: string;
}

const PublishModal: React.FC<PublishModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<PublishStep>('upload');
  const [constructData, setConstructData] = useState<ConstructData>({
    files: [],
    name: '',
    description: '',
    level: '',
    category: '',
    icon: '📦',
    version: '1.0.0',
    tags: [],
    providers: [],
    dependencies: [],
    license: 'MIT',
    pricing: 'free',
    readme: ''
  });

  const steps: PublishStep[] = ['upload', 'metadata', 'pricing', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setConstructData(prev => ({ ...prev, files }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (!constructData.tags.includes(newTag)) {
        setConstructData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tag: string) => {
    setConstructData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'upload':
        return constructData.files.length > 0;
      case 'metadata':
        return (
          constructData.name &&
          constructData.description &&
          constructData.level &&
          constructData.category &&
          constructData.tags.length > 0
        );
      case 'pricing':
        return constructData.pricing === 'free' || constructData.price;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handlePublish = () => {
    // Handle publish logic here
    console.log('Publishing construct:', constructData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Publish Construct
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      index < currentStepIndex
                        ? 'bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Upload Files</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Metadata</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Pricing</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <AnimatePresence mode="wait">
            {currentStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Upload Construct Files
                </h3>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Drag and drop your construct files here, or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".ts,.tsx,.js,.jsx,.yaml,.yml,.json"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <FileCode className="w-4 h-4" />
                    Choose Files
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    Accepted formats: .ts, .tsx, .js, .jsx, .yaml, .yml, .json
                  </p>
                </div>

                {constructData.files.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Uploaded Files ({constructData.files.length})
                    </h4>
                    <div className="space-y-2">
                      {constructData.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileCode className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setConstructData(prev => ({
                                ...prev,
                                files: prev.files.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'metadata' && (
              <motion.div
                key="metadata"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Construct Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={constructData.name}
                      onChange={(e) =>
                        setConstructData(prev => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="My Awesome Construct"
                    />
                  </div>

                  {/* Version */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Version
                    </label>
                    <input
                      type="text"
                      value={constructData.version}
                      onChange={(e) =>
                        setConstructData(prev => ({ ...prev, version: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1.0.0"
                    />
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Construct Level *
                    </label>
                    <select
                      value={constructData.level}
                      onChange={(e) =>
                        setConstructData(prev => ({
                          ...prev,
                          level: e.target.value as ConstructLevel
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select level</option>
                      <option value="L0">L0 - Primitive</option>
                      <option value="L1">L1 - Configured</option>
                      <option value="L2">L2 - Pattern</option>
                      <option value="L3">L3 - Application</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={constructData.category}
                      onChange={(e) =>
                        setConstructData(prev => ({ ...prev, category: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      <option value="UI Components">UI Components</option>
                      <option value="UI Primitives">UI Primitives</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Services">Services</option>
                      <option value="Patterns">Patterns</option>
                      <option value="Utilities">Utilities</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={constructData.description}
                    onChange={(e) =>
                      setConstructData(prev => ({ ...prev, description: e.target.value }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A brief description of what your construct does..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags *
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {constructData.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    onKeyDown={handleTagInput}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a tag and press Enter"
                  />
                </div>

                {/* Providers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Compatible Providers
                  </label>
                  <div className="space-y-2">
                    {['local', 'firebase', 'aws'].map(provider => (
                      <label key={provider} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={constructData.providers.includes(provider)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConstructData(prev => ({
                                ...prev,
                                providers: [...prev.providers, provider]
                              }));
                            } else {
                              setConstructData(prev => ({
                                ...prev,
                                providers: prev.providers.filter(p => p !== provider)
                              }));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {provider}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pricing & License
                </h3>

                {/* Pricing Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Pricing Model
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="radio"
                        name="pricing"
                        value="free"
                        checked={constructData.pricing === 'free'}
                        onChange={() =>
                          setConstructData(prev => ({ ...prev, pricing: 'free' }))
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Free
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Make your construct available for free to the community
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="radio"
                        name="pricing"
                        value="paid"
                        checked={constructData.pricing === 'paid'}
                        onChange={() =>
                          setConstructData(prev => ({ ...prev, pricing: 'paid' }))
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Paid
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Set a one-time price for your construct
                        </div>
                        {constructData.pricing === 'paid' && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">$</span>
                            <input
                              type="number"
                              value={constructData.price || ''}
                              onChange={(e) =>
                                setConstructData(prev => ({
                                  ...prev,
                                  price: parseFloat(e.target.value)
                                }))
                              }
                              className="w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="9.99"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* License */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    License
                  </label>
                  <select
                    value={constructData.license}
                    onChange={(e) =>
                      setConstructData(prev => ({ ...prev, license: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MIT">MIT License</option>
                    <option value="Apache-2.0">Apache License 2.0</option>
                    <option value="GPL-3.0">GPL v3</option>
                    <option value="BSD-3-Clause">BSD 3-Clause</option>
                    <option value="Proprietary">Proprietary</option>
                  </select>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Choose a license that specifies how others can use your construct
                  </p>
                </div>

                {/* README */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    README (Optional)
                  </label>
                  <textarea
                    value={constructData.readme}
                    onChange={(e) =>
                      setConstructData(prev => ({ ...prev, readme: e.target.value }))
                    }
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="# My Construct\n\nDetailed documentation about how to use this construct..."
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Provide detailed documentation in Markdown format
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Review & Publish
                </h3>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{constructData.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {constructData.name || 'Untitled Construct'}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {constructData.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Level:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {constructData.level || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Category:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {constructData.category || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Version:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {constructData.version}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">License:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {constructData.license}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Pricing:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {constructData.pricing === 'free'
                          ? 'Free'
                          : `$${constructData.price?.toFixed(2) || '0.00'}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Files:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {constructData.files.length} files
                      </span>
                    </div>
                  </div>

                  {constructData.tags.length > 0 && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Tags:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {constructData.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Before Publishing:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your construct will be reviewed by our team</li>
                        <li>Review typically takes 1-2 business days</li>
                        <li>You'll receive an email once approved</li>
                        <li>Make sure all code follows best practices</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {currentStepIndex < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={!isStepValid()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4" />
                Publish Construct
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PublishModal;