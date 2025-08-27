/**
 * TDD/SDD Guide Documentation Component
 * Interactive documentation for the Test-Driven Development infrastructure
 */

import React, { useState } from 'react'
import { 
  TestTube, 
  Code2, 
  FileText, 
  Play, 
  CheckCircle2,
  BookOpen,
  Layers,
  Zap,
  Shield,
  BarChart3,
  GitBranch
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export const TDDGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'examples' | 'api'>('overview')
  const [selectedLevel, setSelectedLevel] = useState<'L0' | 'L1' | 'L2' | 'L3'>('L0')

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <TestTube className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">TDD/SDD Infrastructure</h1>
            <p className="text-gray-400 mt-2">
              Automated test generation and specification-driven development
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800">
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'workflow', label: 'Workflow', icon: GitBranch },
            { id: 'examples', label: 'Examples', icon: Code2 },
            { id: 'api', label: 'API Reference', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-500'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && <OverviewSection />}
      {activeTab === 'workflow' && <WorkflowSection />}
      {activeTab === 'examples' && <ExamplesSection selectedLevel={selectedLevel} setSelectedLevel={setSelectedLevel} />}
      {activeTab === 'api' && <APISection />}
    </div>
  )
}

const OverviewSection: React.FC = () => (
  <div className="space-y-12">
    {/* Introduction */}
    <section>
      <h2 className="text-2xl font-semibold mb-4">What is TDD/SDD Infrastructure?</h2>
      <p className="text-gray-300 mb-6">
        The Love Claude Code platform features a comprehensive Test-Driven Development (TDD) and 
        Specification-Driven Development (SDD) infrastructure that automatically generates tests 
        from natural language specifications.
      </p>
      
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          icon={FileText}
          title="Natural Language Specs"
          description="Write specifications in plain English and get structured test suites"
        />
        <FeatureCard
          icon={Zap}
          title="Auto Test Generation"
          description="Generate unit, integration, and E2E tests automatically"
        />
        <FeatureCard
          icon={BarChart3}
          title="Coverage Analysis"
          description="Track test coverage and requirement traceability"
        />
      </div>
    </section>

    {/* Architecture */}
    <section>
      <h2 className="text-2xl font-semibold mb-4">Architecture Overview</h2>
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="space-y-4">
          <ComponentFlow />
        </div>
      </div>
    </section>

    {/* Key Features */}
    <section>
      <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            Multi-Level Support
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
              <span>L0 Primitive tests with focus on isolation</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
              <span>L1 Component tests with configuration validation</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
              <span>L2 Pattern tests with integration scenarios</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
              <span>L3 Application tests with E2E workflows</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Comprehensive Testing
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
              <span>Edge case generation and boundary testing</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
              <span>Security and vulnerability testing</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
              <span>Performance and scalability tests</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
              <span>Accessibility compliance testing</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
)

const WorkflowSection: React.FC = () => (
  <div className="space-y-12">
    {/* TDD Workflow */}
    <section>
      <h2 className="text-2xl font-semibold mb-4">TDD Workflow</h2>
      <div className="bg-gray-900 rounded-lg p-6">
        <TDDWorkflowDiagram />
      </div>
    </section>

    {/* Step by Step Guide */}
    <section>
      <h2 className="text-2xl font-semibold mb-4">Step-by-Step Guide</h2>
      <div className="space-y-6">
        <WorkflowStep
          number={1}
          title="Write Specification"
          description="Start by writing a natural language specification describing what you want to build"
          code={`Create a Button component that:
- Renders with provided text
- Handles click events
- Can be disabled
- Shows loading state

Given a button with text "Submit"
When the user clicks the button
Then the onClick handler should be called`}
        />

        <WorkflowStep
          number={2}
          title="Generate Tests"
          description="Use the TestGenerator to create comprehensive test suites"
          code={`const spec = SpecificationParser.parse(specification);
const tests = TestGenerator.generateTestSuite(spec, {
  framework: 'vitest',
  constructLevel: ConstructLevel.L1,
  includeEdgeCases: true
});`}
        />

        <WorkflowStep
          number={3}
          title="Run Tests (Red)"
          description="Run the generated tests - they should fail initially"
          code={`npm test
# ❌ Button component - should render with provided text
# ❌ Button component - should handle click events
# ❌ Button component - should be disabled when disabled prop is true`}
        />

        <WorkflowStep
          number={4}
          title="Implement (Green)"
          description="Write the minimum code to make tests pass"
          code={`export const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  disabled,
  loading
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="btn"
    >
      {loading ? <Spinner /> : text}
    </button>
  );
};`}
        />

        <WorkflowStep
          number={5}
          title="Refactor"
          description="Improve the code while keeping tests green"
          code={`// Add proper types, styling, accessibility
export const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn('btn', \`btn-\${variant}\`)}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Spinner /> : text}
    </button>
  );
};`}
        />
      </div>
    </section>
  </div>
)

const ExamplesSection: React.FC<{
  selectedLevel: 'L0' | 'L1' | 'L2' | 'L3'
  setSelectedLevel: (level: 'L0' | 'L1' | 'L2' | 'L3') => void
}> = ({ selectedLevel, setSelectedLevel }) => (
  <div className="space-y-8">
    {/* Level Selector */}
    <div className="flex gap-2">
      {(['L0', 'L1', 'L2', 'L3'] as const).map(level => (
        <button
          key={level}
          onClick={() => setSelectedLevel(level)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedLevel === level
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          {level} - {getLevelName(level)}
        </button>
      ))}
    </div>

    {/* Examples */}
    <div className="space-y-8">
      {selectedLevel === 'L0' && <L0Examples />}
      {selectedLevel === 'L1' && <L1Examples />}
      {selectedLevel === 'L2' && <L2Examples />}
      {selectedLevel === 'L3' && <L3Examples />}
    </div>
  </div>
)

const APISection: React.FC = () => (
  <div className="space-y-12">
    {/* TestGenerator API */}
    <section>
      <h2 className="text-2xl font-semibold mb-4">TestGenerator API</h2>
      <div className="bg-gray-900 rounded-lg p-6">
        <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`interface TestGenerationOptions {
  framework?: 'vitest' | 'jest' | 'playwright'
  generateMocks?: boolean
  includeSetup?: boolean
  includeEdgeCases?: boolean
  coverageTarget?: number
  constructLevel?: ConstructLevel
  constructType?: ConstructType
}

class TestGenerator {
  static generateTestSuite(
    spec: ParsedSpecification,
    options?: TestGenerationOptions
  ): GeneratedTest[]

  static generateUnitTests(
    spec: ParsedSpecification,
    options: TestGenerationOptions
  ): GeneratedTest

  static generateIntegrationTests(
    spec: ParsedSpecification,
    options: TestGenerationOptions
  ): GeneratedTest

  static generateE2ETests(
    spec: ParsedSpecification,
    options: TestGenerationOptions
  ): GeneratedTest
}`}
        </SyntaxHighlighter>
      </div>
    </section>

    {/* Generated Test Structure */}
    <section>
      <h2 className="text-2xl font-semibold mb-4">Generated Test Structure</h2>
      <div className="bg-gray-900 rounded-lg p-6">
        <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`interface GeneratedTest {
  fileName: string           // Test file name
  content: string           // Complete test code
  framework: 'vitest' | 'jest' | 'playwright'
  testType: 'unit' | 'integration' | 'e2e'
  specifications: string[]  // Related spec IDs
  estimatedCoverage: number // Coverage estimate
}`}
        </SyntaxHighlighter>
      </div>
    </section>

    {/* Template Generators */}
    <section>
      <h2 className="text-2xl font-semibold mb-4">Template Generators</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">L0 Test Generators</h3>
          <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`L0_TEST_GENERATORS.generatePropTests(props)
L0_TEST_GENERATORS.generateInteractionTests(interactions)
L0_TEST_GENERATORS.generateTestValue(type)
L0_TEST_GENERATORS.generatePropAssertion(prop)`}
          </SyntaxHighlighter>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">L1 Test Generators</h3>
          <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`L1_TEST_GENERATORS.generateEnhancedFunctionalityTests(features)
L1_TEST_GENERATORS.generateStateTests(states)
L1_TEST_GENERATORS.generatePrimitiveEnhancementTests(enhancements)`}
          </SyntaxHighlighter>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">L2 Test Generators</h3>
          <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`L2_TEST_GENERATORS.generatePatternBehaviorTests(behaviors)
L2_TEST_GENERATORS.generateBehaviorTestCode(behavior)
L2_TEST_GENERATORS.generateDependencyOrderAssertions(dependencies)`}
          </SyntaxHighlighter>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">L3 Test Generators</h3>
          <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`L3_TEST_GENERATORS.generateUserWorkflowTests(workflows)
L3_TEST_GENERATORS.generateWorkflowStep(step)
L3_TEST_GENERATORS.generatePerformanceTests(scenarios)`}
          </SyntaxHighlighter>
        </div>
      </div>
    </section>
  </div>
)

// Helper Components
const FeatureCard: React.FC<{
  icon: React.ElementType
  title: string
  description: string
}> = ({ icon: Icon, title, description }) => (
  <div className="bg-gray-900 rounded-lg p-6">
    <Icon className="w-8 h-8 text-green-500 mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
)

const ComponentFlow: React.FC = () => (
  <div className="text-center space-y-4">
    <div className="flex justify-center items-center gap-8">
      <div className="text-center">
        <div className="bg-blue-500/10 p-4 rounded-lg mb-2">
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
        <p className="text-sm">Specification</p>
      </div>
      <div className="text-gray-500">→</div>
      <div className="text-center">
        <div className="bg-green-500/10 p-4 rounded-lg mb-2">
          <Code2 className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-sm">Test Generator</p>
      </div>
      <div className="text-gray-500">→</div>
      <div className="text-center">
        <div className="bg-purple-500/10 p-4 rounded-lg mb-2">
          <Play className="w-8 h-8 text-purple-500" />
        </div>
        <p className="text-sm">Test Runner</p>
      </div>
      <div className="text-gray-500">→</div>
      <div className="text-center">
        <div className="bg-orange-500/10 p-4 rounded-lg mb-2">
          <BarChart3 className="w-8 h-8 text-orange-500" />
        </div>
        <p className="text-sm">Coverage</p>
      </div>
    </div>
  </div>
)

const TDDWorkflowDiagram: React.FC = () => (
  <div className="flex justify-center items-center gap-8">
    <div className="text-center">
      <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
        <span className="text-2xl font-bold text-red-500">RED</span>
      </div>
      <p className="text-sm text-gray-400">Write failing test</p>
    </div>
    <div className="text-gray-500">→</div>
    <div className="text-center">
      <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
        <span className="text-2xl font-bold text-green-500">GREEN</span>
      </div>
      <p className="text-sm text-gray-400">Make test pass</p>
    </div>
    <div className="text-gray-500">→</div>
    <div className="text-center">
      <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
        <span className="text-2xl font-bold text-blue-500">REFACTOR</span>
      </div>
      <p className="text-sm text-gray-400">Improve code</p>
    </div>
  </div>
)

const WorkflowStep: React.FC<{
  number: number
  title: string
  description: string
  code: string
}> = ({ number, title, description, code }) => (
  <div className="bg-gray-900 rounded-lg p-6">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-gray-400 mt-1">{description}</p>
      </div>
    </div>
    <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
      {code}
    </SyntaxHighlighter>
  </div>
)

// Example Components
const L0Examples: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">L0 UI Primitive Example</h3>
      <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`// Specification
const spec = \`
Create a Button primitive that:
- Renders as a native button element
- Accepts onClick handler
- Can be disabled
- Supports different variants (primary, secondary, danger)
\`;

// Generated Test
describe('Button - L0 UI Primitive', () => {
  it('should render without crashing', () => {
    render(<Button onClick={vi.fn()}>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button onClick={vi.fn()} disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});`}
      </SyntaxHighlighter>
    </div>
  </div>
)

const L1Examples: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">L1 Configured Component Example</h3>
      <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`// Specification
const spec = \`
Create a SecureInput component that:
- Validates input according to rules
- Sanitizes dangerous content
- Shows validation errors
- Debounces validation
\`;

// Generated Test
describe('SecureInput - L1 Configured Component', () => {
  it('should validate input according to rules', async () => {
    const rules = { required: true, minLength: 8 };
    render(<SecureInput rules={rules} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'short');
    await user.tab();
    
    expect(screen.getByText(/minimum length/i)).toBeInTheDocument();
  });

  it('should sanitize dangerous input', async () => {
    render(<SecureInput />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, '<script>alert("xss")</script>');
    expect(input.value).not.toContain('<script>');
  });
});`}
      </SyntaxHighlighter>
    </div>
  </div>
)

const L2Examples: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">L2 Pattern Example</h3>
      <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`// Specification
const spec = \`
Create a MasterDetailPattern that:
- Shows list of items on the left
- Shows selected item details on the right
- Synchronizes selection state
- Handles empty states
\`;

// Generated Test
describe('MasterDetailPattern - L2 Pattern', () => {
  it('should update detail view on master selection', async () => {
    render(<MasterDetailPattern items={mockItems} />);
    
    // Select item from master list
    await user.click(screen.getByText('Item 1'));
    
    // Detail view should update
    await waitFor(() => {
      expect(screen.getByTestId('detail-view'))
        .toHaveTextContent('Details for Item 1');
    });
  });

  it('should synchronize state across components', async () => {
    render(<MasterDetailPattern items={mockItems} />);
    
    // Edit in detail view
    const input = within(screen.getByTestId('detail-view'))
      .getByLabelText('Name');
    await user.clear(input);
    await user.type(input, 'Updated Name');
    
    // Master list should reflect change
    expect(screen.getByText('Updated Name')).toBeInTheDocument();
  });
});`}
      </SyntaxHighlighter>
    </div>
  </div>
)

const L3Examples: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">L3 Application Example</h3>
      <SyntaxHighlighter language="typescript" style={vscDarkPlus}>
{`// Specification
const spec = \`
Create a CodeEditor application that:
- Supports multiple files
- Integrates with Claude for assistance
- Provides real-time preview
- Handles project deployment
\`;

// Generated E2E Test
test('complete development workflow', async ({ page }) => {
  const app = new CodeEditorApp(page);
  
  // Create new project
  await app.createProject('My App');
  
  // Write code
  await app.createFile('app.js');
  await app.writeCode(\`
    function hello() {
      return "Hello, World!";
    }
  \`);
  
  // Ask Claude for help
  await app.askClaude('How can I test this function?');
  await expect(page.locator('.claude-response'))
    .toContainText('You can test this function');
  
  // Run tests
  await app.runTests();
  await expect(page.locator('.test-results'))
    .toContainText('All tests passed');
  
  // Deploy
  await app.deploy('production');
  await expect(page.locator('.deployment-status'))
    .toHaveText('Deployed successfully');
});`}
      </SyntaxHighlighter>
    </div>
  </div>
)

// Helper functions
function getLevelName(level: 'L0' | 'L1' | 'L2' | 'L3'): string {
  const names = {
    'L0': 'Primitives',
    'L1': 'Components',
    'L2': 'Patterns',
    'L3': 'Applications'
  }
  return names[level]
}

export default TDDGuide