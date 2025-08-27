import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiInfo, FiEye, FiEyeOff } from 'react-icons/fi'
import { WizardData } from './ConstructCreationWizard'
import { CloudProvider } from '../../constructs/types'
import Editor from '@monaco-editor/react'

interface SpecificationStepProps {
  data: WizardData
  errors: Record<string, string>
  onUpdate: (updates: Partial<WizardData>) => void
}

const providerInfo = {
  [CloudProvider.LOCAL]: { name: 'Local', icon: '💻', color: 'from-gray-500 to-gray-600' },
  [CloudProvider.AWS]: { name: 'AWS', icon: '☁️', color: 'from-orange-500 to-orange-600' },
  [CloudProvider.FIREBASE]: { name: 'Firebase', icon: '🔥', color: 'from-yellow-500 to-yellow-600' },
  [CloudProvider.AZURE]: { name: 'Azure', icon: '🔷', color: 'from-blue-500 to-blue-600' },
  [CloudProvider.GCP]: { name: 'Google Cloud', icon: '🌐', color: 'from-green-500 to-green-600' }
}

export function SpecificationStep({ data, errors, onUpdate }: SpecificationStepProps) {
  const [showInputForm, setShowInputForm] = useState(false)
  const [showOutputForm, setShowOutputForm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [newTag, setNewTag] = useState('')
  
  const [newInput, setNewInput] = useState({
    name: '',
    type: 'string',
    description: '',
    required: true,
    defaultValue: ''
  })
  
  const [newOutput, setNewOutput] = useState({
    name: '',
    type: 'string',
    description: '',
    sensitive: false
  })
  
  const addInput = () => {
    if (newInput.name && newInput.description) {
      onUpdate({
        inputs: [...data.inputs, { ...newInput }]
      })
      setNewInput({
        name: '',
        type: 'string',
        description: '',
        required: true,
        defaultValue: ''
      })
      setShowInputForm(false)
    }
  }
  
  const removeInput = (index: number) => {
    onUpdate({
      inputs: data.inputs.filter((_, i) => i !== index)
    })
  }
  
  const addOutput = () => {
    if (newOutput.name && newOutput.description) {
      onUpdate({
        outputs: [...data.outputs, { ...newOutput }]
      })
      setNewOutput({
        name: '',
        type: 'string',
        description: '',
        sensitive: false
      })
      setShowOutputForm(false)
    }
  }
  
  const removeOutput = (index: number) => {
    onUpdate({
      outputs: data.outputs.filter((_, i) => i !== index)
    })
  }
  
  const toggleProvider = (provider: CloudProvider) => {
    if (data.providers.includes(provider)) {
      onUpdate({
        providers: data.providers.filter(p => p !== provider)
      })
    } else {
      onUpdate({
        providers: [...data.providers, provider]
      })
    }
  }
  
  const addTag = () => {
    if (newTag && !data.tags.includes(newTag)) {
      onUpdate({
        tags: [...data.tags, newTag]
      })
      setNewTag('')
    }
  }
  
  const removeTag = (tag: string) => {
    onUpdate({
      tags: data.tags.filter(t => t !== tag)
    })
  }
  
  // Generate API preview
  const apiPreview = `interface ${data.name || 'MyConstruct'}Props {
${data.inputs.map(input => `  ${input.name}${input.required ? '' : '?'}: ${input.type}; // ${input.description}`).join('\n')}
}

interface ${data.name || 'MyConstruct'}Output {
${data.outputs.map(output => `  ${output.name}: ${output.type}; // ${output.description}`).join('\n')}
}

// Usage example:
const result = await ${data.name || 'myConstruct'}({
${data.inputs.filter(i => i.required).map(input => `  ${input.name}: ${input.type === 'string' ? '"value"' : input.type === 'number' ? '123' : input.type === 'boolean' ? 'true' : '{}'}`).join(',\n')}
});`
  
  return (
    <div className="space-y-6">
      {/* Natural Language Specification */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Natural Language Specification
        </label>
        <textarea
          value={data.naturalLanguageSpec}
          onChange={(e) => onUpdate({ naturalLanguageSpec: e.target.value })}
          placeholder="Describe in plain language what this construct does, how it works, and when to use it. Be specific about behavior, requirements, and edge cases..."
          rows={6}
          className={`w-full px-3 py-2 bg-background/50 border rounded-lg focus:outline-none focus:border-primary/50 transition-all resize-none ${
            errors.naturalLanguageSpec ? 'border-red-500' : 'border-border/50'
          }`}
        />
        {errors.naturalLanguageSpec && (
          <p className="text-red-500 text-sm mt-1">{errors.naturalLanguageSpec}</p>
        )}
      </div>
      
      {/* Inputs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Input Parameters</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInputForm(true)}
            className="flex items-center gap-2 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all text-sm"
          >
            <FiPlus size={14} />
            Add Input
          </motion.button>
        </div>
        
        {errors.inputs && (
          <p className="text-red-500 text-sm mb-2">{errors.inputs}</p>
        )}
        
        {/* Input List */}
        {data.inputs.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.inputs.map((input, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {input.name}
                    {!input.required && <span className="text-muted-foreground"> (optional)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {input.type} • {input.description}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeInput(index)}
                  className="p-1 rounded hover:bg-accent/50 transition-all text-red-500"
                >
                  <FiX size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Add Input Form */}
        <AnimatePresence>
          {showInputForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-accent/10 border border-border/50 rounded-lg p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newInput.name}
                  onChange={(e) => setNewInput({ ...newInput, name: e.target.value })}
                  placeholder="Parameter name"
                  className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
                />
                <select
                  value={newInput.type}
                  onChange={(e) => setNewInput({ ...newInput, type: e.target.value })}
                  className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                  <option value="any">any</option>
                </select>
              </div>
              <input
                type="text"
                value={newInput.description}
                onChange={(e) => setNewInput({ ...newInput, description: e.target.value })}
                placeholder="Description"
                className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newInput.required}
                    onChange={(e) => setNewInput({ ...newInput, required: e.target.checked })}
                    className="rounded border-border"
                  />
                  Required
                </label>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addInput}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm"
                  >
                    Add
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowInputForm(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-accent/50 transition-all text-sm"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Outputs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Output Values</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowOutputForm(true)}
            className="flex items-center gap-2 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all text-sm"
          >
            <FiPlus size={14} />
            Add Output
          </motion.button>
        </div>
        
        {errors.outputs && (
          <p className="text-red-500 text-sm mb-2">{errors.outputs}</p>
        )}
        
        {/* Output List */}
        {data.outputs.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.outputs.map((output, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {output.name}
                    {output.sensitive && <span className="text-red-500 text-xs ml-2">sensitive</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {output.type} • {output.description}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeOutput(index)}
                  className="p-1 rounded hover:bg-accent/50 transition-all text-red-500"
                >
                  <FiX size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Add Output Form */}
        <AnimatePresence>
          {showOutputForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-accent/10 border border-border/50 rounded-lg p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newOutput.name}
                  onChange={(e) => setNewOutput({ ...newOutput, name: e.target.value })}
                  placeholder="Output name"
                  className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
                />
                <select
                  value={newOutput.type}
                  onChange={(e) => setNewOutput({ ...newOutput, type: e.target.value })}
                  className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                  <option value="any">any</option>
                </select>
              </div>
              <input
                type="text"
                value={newOutput.description}
                onChange={(e) => setNewOutput({ ...newOutput, description: e.target.value })}
                placeholder="Description"
                className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newOutput.sensitive}
                    onChange={(e) => setNewOutput({ ...newOutput, sensitive: e.target.checked })}
                    className="rounded border-border"
                  />
                  Sensitive data
                </label>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addOutput}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm"
                  >
                    Add
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowOutputForm(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-accent/50 transition-all text-sm"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Providers */}
      <div>
        <h3 className="text-lg font-medium mb-3">Supported Providers</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(providerInfo).map(([provider, info]) => (
            <motion.button
              key={provider}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleProvider(provider as CloudProvider)}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                data.providers.includes(provider as CloudProvider)
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 hover:border-primary/50'
              }`}
            >
              <span>{info.icon}</span>
              <span className="text-sm">{info.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Tags */}
      <div>
        <h3 className="text-lg font-medium mb-3">Tags</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.tags.map((tag) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full text-sm"
            >
              <span>{tag}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeTag(tag)}
                className="p-0.5 rounded-full hover:bg-accent/50 transition-all"
              >
                <FiX size={12} />
              </motion.button>
            </motion.div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addTag}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all"
          >
            Add
          </motion.button>
        </div>
      </div>
      
      {/* API Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">API Preview</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-1 bg-accent/50 hover:bg-accent rounded-lg transition-all text-sm"
          >
            {showPreview ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </motion.button>
        </div>
        
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="h-64 border border-border/50 rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  value={apiPreview}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 12
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-3">
          <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Specification Tips:</strong>
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Be specific about input validation and constraints</li>
              <li>Mark sensitive outputs (like passwords or API keys)</li>
              <li>Use descriptive names that follow TypeScript conventions</li>
              <li>Include relevant tags to improve discoverability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}