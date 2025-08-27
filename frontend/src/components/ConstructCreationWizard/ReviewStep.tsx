import { FiCheck, FiX, FiInfo, FiCode, FiPackage, FiFileText, FiActivity } from 'react-icons/fi'
import { WizardData } from './ConstructCreationWizard'
import { ConstructLevel } from '../../constructs/types'

interface ReviewStepProps {
  data: WizardData
  errors: Record<string, string>
  onUpdate: (updates: Partial<WizardData>) => void
}

export function ReviewStep({ data, errors }: ReviewStepProps) {
  const isComplete = (section: string): boolean => {
    switch (section) {
      case 'basic':
        return !!(data.name && data.description && data.level && data.type && data.category && data.author)
      case 'dependencies':
        return true // Dependencies are optional
      case 'specification':
        return !!(data.naturalLanguageSpec && data.inputs.length > 0 && data.outputs.length > 0)
      case 'testing':
        return data.testCases.length > 0
      case 'implementation':
        return !!(data.implementationCode && data.liveValidationPassed)
      default:
        return false
    }
  }
  
  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'basic':
        return <FiInfo size={16} />
      case 'dependencies':
        return <FiPackage size={16} />
      case 'specification':
        return <FiFileText size={16} />
      case 'testing':
        return <FiActivity size={16} />
      case 'implementation':
        return <FiCode size={16} />
      default:
        return null
    }
  }
  
  const sections = [
    { id: 'basic', title: 'Basic Information' },
    { id: 'dependencies', title: 'Dependencies' },
    { id: 'specification', title: 'Specification' },
    { id: 'testing', title: 'Testing' },
    { id: 'implementation', title: 'Implementation' }
  ]
  
  const allSectionsComplete = sections.every(section => isComplete(section.id))
  
  // Calculate metrics
  const metrics = {
    totalInputs: data.inputs.length,
    totalOutputs: data.outputs.length,
    totalDependencies: data.dependencies.length + data.externalDependencies.length,
    totalTests: data.testCases.length,
    codeLines: data.implementationCode.split('\n').length,
    estimatedComplexity: data.level === ConstructLevel.L0 ? 'Low' :
                        data.level === ConstructLevel.L1 ? 'Medium' :
                        data.level === ConstructLevel.L2 ? 'High' :
                        'Very High'
  }
  
  return (
    <div className="space-y-6">
      {/* Completion Status */}
      <div className="bg-accent/10 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Completion Status</h3>
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isComplete(section.id) ? 'bg-green-500/20' : 'bg-accent/30'
                }`}>
                  {getSectionIcon(section.id)}
                </div>
                <span className="font-medium">{section.title}</span>
              </div>
              {isComplete(section.id) ? (
                <FiCheck className="text-green-500" size={20} />
              ) : (
                <FiX className="text-muted-foreground" size={20} />
              )}
            </div>
          ))}
        </div>
        
        {!allSectionsComplete && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-500">
              Please complete all required sections before creating the construct.
            </p>
          </div>
        )}
      </div>
      
      {/* Construct Summary */}
      <div>
        <h3 className="text-lg font-medium mb-4">Construct Summary</h3>
        
        {/* Basic Info */}
        <div className="mb-6 p-4 bg-accent/10 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">{data.icon}</span>
            <div className="flex-1">
              <h4 className="text-xl font-semibold">{data.name || 'Unnamed Construct'}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {data.description || 'No description provided'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Level:</span>
              <span className="ml-2 font-medium">{data.level || 'Not selected'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 font-medium">{data.type || 'Not selected'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>
              <span className="ml-2 font-medium">{data.category || 'Not selected'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Version:</span>
              <span className="ml-2 font-medium">{data.version}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Author:</span>
              <span className="ml-2 font-medium">{data.author || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">License:</span>
              <span className="ml-2 font-medium">{data.license}</span>
            </div>
          </div>
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-accent/10 rounded-lg text-center">
            <p className="text-2xl font-semibold">{metrics.totalInputs}</p>
            <p className="text-sm text-muted-foreground">Inputs</p>
          </div>
          <div className="p-4 bg-accent/10 rounded-lg text-center">
            <p className="text-2xl font-semibold">{metrics.totalOutputs}</p>
            <p className="text-sm text-muted-foreground">Outputs</p>
          </div>
          <div className="p-4 bg-accent/10 rounded-lg text-center">
            <p className="text-2xl font-semibold">{metrics.totalDependencies}</p>
            <p className="text-sm text-muted-foreground">Dependencies</p>
          </div>
          <div className="p-4 bg-accent/10 rounded-lg text-center">
            <p className="text-2xl font-semibold">{metrics.totalTests}</p>
            <p className="text-sm text-muted-foreground">Test Cases</p>
          </div>
          <div className="p-4 bg-accent/10 rounded-lg text-center">
            <p className="text-2xl font-semibold">{metrics.codeLines}</p>
            <p className="text-sm text-muted-foreground">Lines of Code</p>
          </div>
          <div className="p-4 bg-accent/10 rounded-lg text-center">
            <p className="text-2xl font-semibold">{metrics.estimatedComplexity}</p>
            <p className="text-sm text-muted-foreground">Complexity</p>
          </div>
        </div>
        
        {/* Specification Summary */}
        {data.naturalLanguageSpec && (
          <div className="mb-6">
            <h4 className="font-medium mb-2">Natural Language Specification</h4>
            <div className="p-3 bg-accent/10 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">
                {data.naturalLanguageSpec.length > 200
                  ? data.naturalLanguageSpec.substring(0, 200) + '...'
                  : data.naturalLanguageSpec}
              </p>
            </div>
          </div>
        )}
        
        {/* Dependencies Summary */}
        {(data.dependencies.length > 0 || data.externalDependencies.length > 0) && (
          <div className="mb-6">
            <h4 className="font-medium mb-2">Dependencies</h4>
            <div className="space-y-2">
              {data.dependencies.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Construct Dependencies:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.dependencies.map(dep => (
                      <span key={dep.constructId} className="px-2 py-1 bg-accent/30 rounded text-xs">
                        {dep.constructId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.externalDependencies.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">External Dependencies:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.externalDependencies.map((dep, index) => (
                      <span key={index} className="px-2 py-1 bg-accent/30 rounded text-xs">
                        {dep.name}@{dep.version}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Tags */}
        {data.tags.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {data.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Self-Referential Info */}
        {data.selfReferential.isPlatformConstruct && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <span className="text-purple-500">✨</span>
              Platform Construct
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Development Method:</span>
                <span className="ml-2 font-medium capitalize">{data.selfReferential.developmentMethod}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Vibe-Coding:</span>
                <span className="ml-2 font-medium">{data.selfReferential.vibeCodingPercentage}%</span>
              </div>
              {data.selfReferential.canBuildConstructs && (
                <div className="col-span-2">
                  <span className="text-purple-500">🔧 This construct can build other constructs</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Final Checklist */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-3">
          <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-2">Before Creating:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Review all information for accuracy</li>
              <li>Ensure tests cover critical functionality</li>
              <li>Verify implementation follows best practices</li>
              <li>Check that documentation is clear and complete</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="font-medium text-red-500 mb-2">Please fix the following errors:</p>
          <ul className="text-sm space-y-1">
            {Object.entries(errors).map(([key, error]) => (
              <li key={key} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}