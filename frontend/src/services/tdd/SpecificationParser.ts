/**
 * Specification Parser Service
 * Converts natural language specifications to formal construct specifications
 */

import { PlatformConstructDefinition, ConstructLevel, CloudProvider } from '../../constructs/types';

export interface ParsedSpecification {
  type: 'construct' | 'test' | 'feature' | 'behavior';
  name: string;
  description: string;
  level?: ConstructLevel;
  categories?: string[];
  requirements: SpecRequirement[];
  behaviors: SpecBehavior[];
  testCases: TestCase[];
  inputs?: InputSpecification[];
  outputs?: OutputSpecification[];
  dependencies?: string[];
  constraints?: Constraint[];
  examples?: Example[];
  metadata?: SpecMetadata;
}

export interface SpecRequirement {
  id: string;
  type: 'functional' | 'non-functional' | 'technical' | 'business';
  description: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  acceptance?: string[];
  testable: boolean;
}

export interface SpecBehavior {
  id: string;
  given: string[];
  when: string[];
  then: string[];
  examples?: BehaviorExample[];
}

export interface TestCase {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  description: string;
  steps: TestStep[];
  expectedResult: string;
  requirementIds: string[];
}

export interface TestStep {
  action: string;
  input?: any;
  expectedOutput?: any;
  assertions?: string[];
}

export interface InputSpecification {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface OutputSpecification {
  name: string;
  type: string;
  description: string;
  format?: string;
}

export interface ValidationRule {
  type: 'pattern' | 'range' | 'enum' | 'custom';
  value: any;
  message: string;
}

export interface Constraint {
  type: 'performance' | 'security' | 'compatibility' | 'resource';
  description: string;
  metric?: string;
  threshold?: number;
}

export interface Example {
  title: string;
  description: string;
  code?: string;
  scenario?: string;
}

export interface BehaviorExample {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}

export interface SpecMetadata {
  author?: string;
  version?: string;
  createdAt?: Date;
  tags?: string[];
  aiGenerated?: boolean;
  confidence?: number;
}

export class SpecificationParser {
  private patterns = {
    // Construct patterns
    constructName: /(?:create|build|implement|design|develop)\s+(?:a\s+)?(?:new\s+)?(\w+(?:\s+\w+)*?)(?:\s+(?:construct|component|service|system))?/i,
    constructLevel: /(?:L[0-3]|level\s*[0-3]|primitive|composed|pattern|application)/i,
    
    // Requirement patterns
    requirement: /(?:must|should|shall|needs?\s+to|required?\s+to)\s+(.+?)(?:\.|$)/gi,
    functional: /(?:user|system|feature|function|capability)/i,
    nonFunctional: /(?:performance|security|scalability|reliability|availability)/i,
    
    // Behavior patterns
    given: /(?:given|assuming|with)\s+(.+?)(?:\s+(?:when|then|and)|$)/gi,
    when: /(?:when|if)\s+(.+?)(?:\s+(?:then|and)|$)/gi,
    then: /(?:then|expect|should)\s+(.+?)(?:\s+(?:and)|$)/gi,
    
    // Input/Output patterns
    input: /(?:accepts?|takes?|requires?|inputs?|parameters?)\s+(.+?)(?:\s+(?:and|of|with)|$)/gi,
    output: /(?:returns?|outputs?|produces?|generates?|results?\s+in)\s+(.+?)(?:\s+(?:and|with)|$)/gi,
    
    // Dependency patterns
    dependency: /(?:depends?\s+on|requires?|uses?|needs?)\s+(.+?)(?:\s+(?:and|for)|$)/gi,
    
    // Constraint patterns
    performance: /(?:within|less\s+than|under|max(?:imum)?)\s+(\d+)\s*(ms|seconds?|minutes?)/gi,
    security: /(?:secure|encrypted|authenticated|authorized|protected)/i,
    
    // Test patterns
    testCase: /(?:test|verify|check|ensure)\s+(?:that\s+)?(.+?)(?:\.|$)/gi,
    assertion: /(?:assert|expect|should)\s+(.+?)(?:\.|$)/gi
  };

  /**
   * Parse natural language specification into formal specification
   */
  async parseSpecification(naturalLanguageSpec: string): Promise<ParsedSpecification> {
    const lines = naturalLanguageSpec.split('\n').filter(line => line.trim());
    
    const spec: ParsedSpecification = {
      type: this.detectSpecificationType(naturalLanguageSpec),
      name: this.extractName(naturalLanguageSpec),
      description: this.extractDescription(lines),
      requirements: [],
      behaviors: [],
      testCases: [],
      metadata: {
        aiGenerated: true,
        createdAt: new Date(),
        confidence: 0
      }
    };

    // Extract construct level if applicable
    if (spec.type === 'construct') {
      spec.level = this.extractConstructLevel(naturalLanguageSpec);
      spec.categories = this.extractCategories(naturalLanguageSpec);
    }

    // Parse requirements
    spec.requirements = this.extractRequirements(naturalLanguageSpec);
    
    // Parse behaviors (Given-When-Then)
    spec.behaviors = this.extractBehaviors(naturalLanguageSpec);
    
    // Parse test cases
    spec.testCases = this.extractTestCases(naturalLanguageSpec);
    
    // Parse inputs and outputs
    spec.inputs = this.extractInputs(naturalLanguageSpec);
    spec.outputs = this.extractOutputs(naturalLanguageSpec);
    
    // Parse dependencies
    spec.dependencies = this.extractDependencies(naturalLanguageSpec);
    
    // Parse constraints
    spec.constraints = this.extractConstraints(naturalLanguageSpec);
    
    // Calculate confidence score
    spec.metadata!.confidence = this.calculateConfidence(spec);
    
    return spec;
  }

  /**
   * Convert parsed specification to construct definition
   */
  async toConstructDefinition(spec: ParsedSpecification): Promise<Partial<PlatformConstructDefinition>> {
    if (spec.type !== 'construct') {
      throw new Error('Specification is not for a construct');
    }

    const definition: Partial<PlatformConstructDefinition> = {
      name: spec.name,
      description: spec.description,
      level: spec.level || ConstructLevel.L1,
      categories: spec.categories || ['general'],
      version: '1.0.0',
      author: spec.metadata?.author || 'AI Generated',
      tags: spec.metadata?.tags || [],
      providers: [CloudProvider.LOCAL], // Default to local
      dependencies: spec.dependencies || [],
      inputs: spec.inputs?.map(input => ({
        name: input.name,
        type: input.type,
        description: input.description,
        required: input.required,
        defaultValue: input.defaultValue
      })) || [],
      outputs: spec.outputs?.map(output => ({
        name: output.name,
        type: output.type,
        description: output.description
      })) || [],
      examples: spec.examples || [],
      bestPractices: this.generateBestPractices(spec),
      selfReferential: {
        isPlatformConstruct: false,
        developmentMethod: 'specification-driven',
        vibeCodingPercentage: 80
      }
    };

    return definition;
  }

  /**
   * Generate test suite from specification
   */
  async generateTestSuite(spec: ParsedSpecification): Promise<string> {
    const testImports = this.generateTestImports(spec);
    const testCases = spec.testCases.map(tc => this.generateTestCase(tc)).join('\n\n');
    const behaviorTests = spec.behaviors.map(b => this.generateBehaviorTest(b)).join('\n\n');

    return `${testImports}

describe('${spec.name}', () => {
  ${testCases}
  
  ${behaviorTests}
});`;
  }

  private detectSpecificationType(text: string): ParsedSpecification['type'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('construct') || lowerText.includes('component')) {
      return 'construct';
    } else if (lowerText.includes('test') || lowerText.includes('spec')) {
      return 'test';
    } else if (lowerText.includes('feature')) {
      return 'feature';
    } else {
      return 'behavior';
    }
  }

  private extractName(text: string): string {
    const match = text.match(this.patterns.constructName);
    if (match) {
      return match[1].trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    }
    
    // Fallback: extract first meaningful phrase
    const lines = text.split('\n');
    const firstLine = lines.find(line => line.trim().length > 0) || '';
    return firstLine.split(/\s+/).slice(0, 3).join(' ');
  }

  private extractDescription(lines: string[]): string {
    // Usually the first paragraph or first few lines
    const descLines: string[] = [];
    
    for (const line of lines) {
      if (line.trim() === '') break;
      if (line.match(/^(requirements?|behaviors?|tests?|inputs?|outputs?):/i)) break;
      descLines.push(line);
    }
    
    return descLines.join(' ').trim();
  }

  private extractConstructLevel(text: string): ConstructLevel | undefined {
    const match = text.match(this.patterns.constructLevel);
    if (!match) return undefined;
    
    const levelText = match[0].toLowerCase();
    if (levelText.includes('0') || levelText.includes('primitive')) return ConstructLevel.L0;
    if (levelText.includes('1') || levelText.includes('composed')) return ConstructLevel.L1;
    if (levelText.includes('2') || levelText.includes('pattern')) return ConstructLevel.L2;
    if (levelText.includes('3') || levelText.includes('application')) return ConstructLevel.L3;
    
    return ConstructLevel.L1; // Default
  }

  private extractCategories(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Check for UI categories
    if (lowerText.match(/\b(ui|interface|visual|display|render)\b/)) {
      categories.push('ui');
    }
    
    // Check for infrastructure categories
    if (lowerText.match(/\b(infrastructure|backend|server|database|storage)\b/)) {
      categories.push('infrastructure');
    }
    
    // Check for pattern categories
    if (lowerText.match(/\b(pattern|template|reusable|composition)\b/)) {
      categories.push('patterns');
    }
    
    // Check for application categories
    if (lowerText.match(/\b(application|app|platform|system)\b/)) {
      categories.push('applications');
    }
    
    return categories.length > 0 ? categories : ['general'];
  }

  private extractRequirements(text: string): SpecRequirement[] {
    const requirements: SpecRequirement[] = [];
    const matches = Array.from(text.matchAll(this.patterns.requirement));
    
    matches.forEach((match, index) => {
      const requirementText = match[1].trim();
      const priority = this.extractPriority(match[0]);
      const type = this.detectRequirementType(requirementText);
      
      requirements.push({
        id: `REQ-${index + 1}`,
        type,
        description: requirementText,
        priority,
        testable: this.isTestable(requirementText),
        acceptance: this.extractAcceptanceCriteria(requirementText)
      });
    });
    
    return requirements;
  }

  private extractBehaviors(text: string): SpecBehavior[] {
    const behaviors: SpecBehavior[] = [];
    const sections = text.split(/(?=given|when|then)/i);
    
    let currentBehavior: Partial<SpecBehavior> = {};
    let behaviorId = 1;
    
    sections.forEach(section => {
      const givenMatches = Array.from(section.matchAll(this.patterns.given));
      const whenMatches = Array.from(section.matchAll(this.patterns.when));
      const thenMatches = Array.from(section.matchAll(this.patterns.then));
      
      if (givenMatches.length > 0) {
        currentBehavior.given = givenMatches.map(m => m[1].trim());
      }
      
      if (whenMatches.length > 0) {
        currentBehavior.when = whenMatches.map(m => m[1].trim());
      }
      
      if (thenMatches.length > 0) {
        currentBehavior.then = thenMatches.map(m => m[1].trim());
        
        // Complete behavior found
        if (currentBehavior.given && currentBehavior.when) {
          behaviors.push({
            id: `BEH-${behaviorId++}`,
            given: currentBehavior.given,
            when: currentBehavior.when,
            then: currentBehavior.then
          });
          currentBehavior = {};
        }
      }
    });
    
    return behaviors;
  }

  private extractTestCases(text: string): TestCase[] {
    const testCases: TestCase[] = [];
    const matches = Array.from(text.matchAll(this.patterns.testCase));
    
    matches.forEach((match, index) => {
      const testDescription = match[1].trim();
      
      testCases.push({
        id: `TC-${index + 1}`,
        name: this.generateTestName(testDescription),
        type: this.detectTestType(testDescription),
        description: testDescription,
        steps: this.extractTestSteps(testDescription),
        expectedResult: this.extractExpectedResult(testDescription),
        requirementIds: [] // Would be linked in a more sophisticated parser
      });
    });
    
    return testCases;
  }

  private extractInputs(text: string): InputSpecification[] {
    const inputs: InputSpecification[] = [];
    const matches = Array.from(text.matchAll(this.patterns.input));
    
    matches.forEach(match => {
      const inputText = match[1].trim();
      const parsedInputs = this.parseInputDescription(inputText);
      inputs.push(...parsedInputs);
    });
    
    return inputs;
  }

  private extractOutputs(text: string): OutputSpecification[] {
    const outputs: OutputSpecification[] = [];
    const matches = Array.from(text.matchAll(this.patterns.output));
    
    matches.forEach(match => {
      const outputText = match[1].trim();
      const parsedOutputs = this.parseOutputDescription(outputText);
      outputs.push(...parsedOutputs);
    });
    
    return outputs;
  }

  private extractDependencies(text: string): string[] {
    const dependencies: Set<string> = new Set();
    const matches = Array.from(text.matchAll(this.patterns.dependency));
    
    matches.forEach(match => {
      const depText = match[1].trim();
      const deps = depText.split(/\s*,\s*|\s+and\s+/);
      deps.forEach(dep => dependencies.add(dep.trim()));
    });
    
    return Array.from(dependencies);
  }

  private extractConstraints(text: string): Constraint[] {
    const constraints: Constraint[] = [];
    
    // Performance constraints
    const perfMatches = Array.from(text.matchAll(this.patterns.performance));
    perfMatches.forEach(match => {
      constraints.push({
        type: 'performance',
        description: match[0],
        metric: match[2],
        threshold: parseInt(match[1])
      });
    });
    
    // Security constraints
    if (text.match(this.patterns.security)) {
      constraints.push({
        type: 'security',
        description: 'Security requirements detected'
      });
    }
    
    return constraints;
  }

  private extractPriority(text: string): SpecRequirement['priority'] {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('must') || lowerText.includes('shall')) return 'must';
    if (lowerText.includes('should')) return 'should';
    if (lowerText.includes('could')) return 'could';
    return 'should'; // Default
  }

  private detectRequirementType(text: string): SpecRequirement['type'] {
    const lowerText = text.toLowerCase();
    if (lowerText.match(this.patterns.functional)) return 'functional';
    if (lowerText.match(this.patterns.nonFunctional)) return 'non-functional';
    return 'functional'; // Default
  }

  private isTestable(text: string): boolean {
    // Simple heuristic: requirements with measurable outcomes are testable
    return text.match(/\b(return|display|show|calculate|validate|verify)\b/i) !== null;
  }

  private extractAcceptanceCriteria(text: string): string[] {
    // Extract bullet points or conditions
    const criteria: string[] = [];
    const conditions = text.split(/\s*(?:and|,)\s*/);
    
    conditions.forEach(condition => {
      if (condition.length > 10) { // Meaningful condition
        criteria.push(condition.trim());
      }
    });
    
    return criteria;
  }

  private generateTestName(description: string): string {
    return description
      .split(/\s+/)
      .slice(0, 5)
      .join(' ')
      .replace(/[^a-zA-Z0-9\s]/g, '');
  }

  private detectTestType(description: string): TestCase['type'] {
    const lowerText = description.toLowerCase();
    if (lowerText.includes('unit')) return 'unit';
    if (lowerText.includes('integration')) return 'integration';
    if (lowerText.includes('e2e') || lowerText.includes('end to end')) return 'e2e';
    if (lowerText.includes('performance')) return 'performance';
    if (lowerText.includes('security')) return 'security';
    return 'unit'; // Default
  }

  private extractTestSteps(description: string): TestStep[] {
    // Simple step extraction
    const steps: TestStep[] = [];
    const actionWords = ['click', 'enter', 'select', 'verify', 'check', 'assert'];
    
    actionWords.forEach(action => {
      if (description.toLowerCase().includes(action)) {
        steps.push({
          action: `${action} action detected`,
          assertions: []
        });
      }
    });
    
    return steps.length > 0 ? steps : [{ action: 'Execute test', assertions: [] }];
  }

  private extractExpectedResult(description: string): string {
    const resultMatch = description.match(/(?:should|expect|result)\s+(.+?)(?:\.|$)/i);
    return resultMatch ? resultMatch[1].trim() : 'Expected behavior occurs';
  }

  private parseInputDescription(text: string): InputSpecification[] {
    const inputs: InputSpecification[] = [];
    
    // Parse structured input like "string name, number age"
    const parts = text.split(/\s*,\s*/);
    
    parts.forEach(part => {
      const typeMatch = part.match(/(\w+)\s+(\w+)/);
      if (typeMatch) {
        inputs.push({
          name: typeMatch[2],
          type: typeMatch[1],
          description: `${typeMatch[2]} parameter`,
          required: !part.includes('optional')
        });
      } else {
        // Fallback for unstructured input
        inputs.push({
          name: part.replace(/[^a-zA-Z0-9]/g, ''),
          type: 'any',
          description: part,
          required: true
        });
      }
    });
    
    return inputs;
  }

  private parseOutputDescription(text: string): OutputSpecification[] {
    const outputs: OutputSpecification[] = [];
    
    // Similar to input parsing
    const parts = text.split(/\s*,\s*/);
    
    parts.forEach(part => {
      const typeMatch = part.match(/(\w+)\s+(\w+)/);
      if (typeMatch) {
        outputs.push({
          name: typeMatch[2],
          type: typeMatch[1],
          description: `${typeMatch[2]} output`
        });
      } else {
        outputs.push({
          name: part.replace(/[^a-zA-Z0-9]/g, ''),
          type: 'any',
          description: part
        });
      }
    });
    
    return outputs;
  }

  private calculateConfidence(spec: ParsedSpecification): number {
    let score = 0;
    let maxScore = 0;
    
    // Name quality
    maxScore += 20;
    if (spec.name && spec.name.length > 3) score += 20;
    
    // Description quality
    maxScore += 20;
    if (spec.description && spec.description.length > 20) score += 20;
    
    // Requirements
    maxScore += 20;
    if (spec.requirements.length > 0) score += Math.min(20, spec.requirements.length * 5);
    
    // Behaviors
    maxScore += 20;
    if (spec.behaviors.length > 0) score += Math.min(20, spec.behaviors.length * 10);
    
    // Test cases
    maxScore += 20;
    if (spec.testCases.length > 0) score += Math.min(20, spec.testCases.length * 5);
    
    return Math.round((score / maxScore) * 100) / 100;
  }

  private generateBestPractices(spec: ParsedSpecification): string[] {
    const practices: string[] = [];
    
    // Based on requirements
    if (spec.requirements.some(r => r.type === 'security')) {
      practices.push('Implement proper authentication and authorization');
      practices.push('Encrypt sensitive data at rest and in transit');
    }
    
    if (spec.requirements.some(r => r.type === 'performance')) {
      practices.push('Optimize for performance from the start');
      practices.push('Implement caching where appropriate');
    }
    
    // Based on constraints
    if (spec.constraints?.some(c => c.type === 'performance')) {
      practices.push('Monitor performance metrics continuously');
    }
    
    // General practices
    practices.push('Write comprehensive tests for all behaviors');
    practices.push('Document all public APIs');
    practices.push('Follow the single responsibility principle');
    
    return practices;
  }

  private generateTestImports(spec: ParsedSpecification): string {
    const imports: string[] = [
      "import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';"
    ];
    
    if (spec.type === 'construct') {
      imports.push(`import { ${spec.name} } from './${spec.name}';`);
    }
    
    if (spec.testCases.some(tc => tc.type === 'e2e')) {
      imports.push("import { render, fireEvent, waitFor } from '@testing-library/react';");
    }
    
    return imports.join('\n');
  }

  private generateTestCase(testCase: TestCase): string {
    const steps = testCase.steps.map(step => `    // ${step.action}`).join('\n');
    
    return `  it('${testCase.name}', async () => {
${steps}
    
    // Assert expected result
    expect(result).toBe('${testCase.expectedResult}');
  });`;
  }

  private generateBehaviorTest(behavior: SpecBehavior): string {
    const given = behavior.given.map(g => `    // Given: ${g}`).join('\n');
    const when = behavior.when.map(w => `    // When: ${w}`).join('\n');
    const then = behavior.then.map(t => `    // Then: ${t}`).join('\n');
    
    return `  describe('Behavior: ${behavior.id}', () => {
    it('should behave correctly', async () => {
${given}
      
${when}
      
${then}
    });
  });`;
  }
}

// Export singleton instance
export const specificationParser = new SpecificationParser();