/**
 * Tests for SpecificationParser
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SpecificationParser } from '../SpecificationParser';
import { ConstructLevel } from '../../../constructs/types';

describe('SpecificationParser', () => {
  let parser: SpecificationParser;

  beforeEach(() => {
    parser = new SpecificationParser();
  });

  describe('parseSpecification', () => {
    it('should parse a simple construct specification', async () => {
      const spec = `
        Create a new button construct that displays text and handles clicks.
        
        The button must accept a label and onClick handler.
        It should display the label text and trigger the onClick when clicked.
        The button must be accessible with proper ARIA attributes.
      `;

      const result = await parser.parseSpecification(spec);

      expect(result.type).toBe('construct');
      expect(result.name).toContain('Button');
      expect(result.description).toContain('displays text and handles clicks');
      expect(result.requirements.length).toBeGreaterThan(0);
      expect(result.requirements[0].priority).toBe('must');
      expect(result.inputs?.length).toBeGreaterThan(0);
    });

    it('should detect construct levels', async () => {
      const l0Spec = 'Create an L0 primitive button component';
      const l1Spec = 'Build a Level 1 composed editor construct';
      const l2Spec = 'Implement an L2 pattern for authentication';
      const l3Spec = 'Design a Level 3 application platform';

      const l0Result = await parser.parseSpecification(l0Spec);
      const l1Result = await parser.parseSpecification(l1Spec);
      const l2Result = await parser.parseSpecification(l2Spec);
      const l3Result = await parser.parseSpecification(l3Spec);

      expect(l0Result.level).toBe(ConstructLevel.L0);
      expect(l1Result.level).toBe(ConstructLevel.L1);
      expect(l2Result.level).toBe(ConstructLevel.L2);
      expect(l3Result.level).toBe(ConstructLevel.L3);
    });

    it('should extract Given-When-Then behaviors', async () => {
      const spec = `
        Create a login form construct.
        
        Given a user is on the login page
        When they enter valid credentials
        Then they should be logged in successfully
        
        Given a user enters invalid credentials
        When they submit the form
        Then an error message should be displayed
      `;

      const result = await parser.parseSpecification(spec);

      expect(result.behaviors.length).toBe(2);
      expect(result.behaviors[0].given).toContain('a user is on the login page');
      expect(result.behaviors[0].when).toContain('they enter valid credentials');
      expect(result.behaviors[0].then).toContain('they should be logged in successfully');
    });

    it('should extract test cases', async () => {
      const spec = `
        Create a calculator construct.
        
        Test that addition works correctly with positive numbers.
        Verify that subtraction handles negative results.
        Ensure that division by zero throws an error.
      `;

      const result = await parser.parseSpecification(spec);

      expect(result.testCases.length).toBe(3);
      expect(result.testCases[0].description).toContain('addition works correctly');
      expect(result.testCases[1].description).toContain('subtraction handles negative');
      expect(result.testCases[2].description).toContain('division by zero');
    });

    it('should extract inputs and outputs', async () => {
      const spec = `
        Create a data transformer construct.
        
        It accepts a string input and number count parameter.
        The construct takes an optional boolean flag for validation.
        
        It returns a transformed string output and status code.
        The result produces an array of processed items.
      `;

      const result = await parser.parseSpecification(spec);

      expect(result.inputs?.length).toBeGreaterThan(0);
      expect(result.inputs?.some(i => i.type === 'string')).toBe(true);
      expect(result.inputs?.some(i => i.type === 'number')).toBe(true);
      expect(result.inputs?.some(i => !i.required)).toBe(true);

      expect(result.outputs?.length).toBeGreaterThan(0);
      expect(result.outputs?.some(o => o.type === 'string')).toBe(true);
      expect(result.outputs?.some(o => o.description.includes('array'))).toBe(true);
    });

    it('should extract dependencies', async () => {
      const spec = `
        Create a secure editor construct.
        
        This construct depends on CodeMirror and AuthService.
        It requires the EncryptionModule for secure storage.
        The editor uses WebSocket for real-time collaboration.
      `;

      const result = await parser.parseSpecification(spec);

      expect(result.dependencies).toContain('CodeMirror');
      expect(result.dependencies).toContain('AuthService');
      expect(result.dependencies).toContain('EncryptionModule');
      expect(result.dependencies).toContain('WebSocket');
    });

    it('should extract performance constraints', async () => {
      const spec = `
        Create a fast search component.
        
        Search results must be displayed within 100ms.
        The component should handle up to 10000 items.
        Response time must be under 2 seconds for large datasets.
      `;

      const result = await parser.parseSpecification(spec);

      expect(result.constraints?.length).toBeGreaterThan(0);
      const perfConstraints = result.constraints?.filter(c => c.type === 'performance');
      expect(perfConstraints?.length).toBeGreaterThan(0);
      expect(perfConstraints?.[0].threshold).toBe(100);
      expect(perfConstraints?.[0].metric).toBe('ms');
    });

    it('should calculate confidence score', async () => {
      const goodSpec = `
        Create a comprehensive user management system.
        
        This system provides complete user lifecycle management including registration,
        authentication, profile management, and account deletion.
        
        Requirements:
        - Must support email and OAuth authentication
        - Should implement role-based access control
        - Must encrypt all user data at rest
        - Should provide audit logging
        
        Given a new user visits the site
        When they complete the registration form
        Then a new account should be created
        
        Test that user registration works correctly.
        Verify that duplicate emails are rejected.
        Ensure passwords are properly hashed.
      `;

      const poorSpec = 'Make a thing that does stuff.';

      const goodResult = await parser.parseSpecification(goodSpec);
      const poorResult = await parser.parseSpecification(poorSpec);

      expect(goodResult.metadata?.confidence).toBeGreaterThan(0.7);
      expect(poorResult.metadata?.confidence).toBeLessThan(0.3);
    });
  });

  describe('toConstructDefinition', () => {
    it('should convert parsed spec to construct definition', async () => {
      const spec = `
        Create an L1 secure form construct for user input.
        
        Categories: ui, forms, security
        
        It must validate user input and prevent XSS attacks.
        The form should support multiple field types.
        
        Inputs: fields array, validation rules, submit handler
        Outputs: form data, validation errors
        
        Depends on ValidationLibrary and SecurityModule.
      `;

      const parsed = await parser.parseSpecification(spec);
      const definition = await parser.toConstructDefinition(parsed);

      expect(definition.name).toContain('SecureForm');
      expect(definition.level).toBe(ConstructLevel.L1);
      expect(definition.categories).toContain('ui');
      expect(definition.categories).toContain('security');
      expect(definition.dependencies).toContain('ValidationLibrary');
      expect(definition.inputs?.length).toBeGreaterThan(0);
      expect(definition.outputs?.length).toBeGreaterThan(0);
      expect(definition.selfReferential?.developmentMethod).toBe('specification-driven');
    });
  });

  describe('generateTestSuite', () => {
    it('should generate test code from specification', async () => {
      const spec = `
        Create a counter component.
        
        Given the counter is at 0
        When the increment button is clicked
        Then the counter should show 1
        
        Test that increment increases the count.
        Test that decrement decreases the count.
        Verify that count cannot go below 0.
      `;

      const parsed = await parser.parseSpecification(spec);
      const testCode = await parser.generateTestSuite(parsed);

      expect(testCode).toContain("import { describe, it, expect");
      expect(testCode).toContain("describe('Counter");
      expect(testCode).toContain("it('increment increases the count'");
      expect(testCode).toContain("it('decrement decreases the count'");
      expect(testCode).toContain("Given: the counter is at 0");
      expect(testCode).toContain("When: the increment button is clicked");
      expect(testCode).toContain("Then: the counter should show 1");
    });
  });

  describe('edge cases', () => {
    it('should handle empty specification', async () => {
      const result = await parser.parseSpecification('');
      
      expect(result.type).toBe('behavior');
      expect(result.name).toBe('');
      expect(result.requirements.length).toBe(0);
      expect(result.metadata?.confidence).toBe(0);
    });

    it('should handle specification with only requirements', async () => {
      const spec = `
        The system must be secure.
        It should be fast.
        The UI must be responsive.
      `;

      const result = await parser.parseSpecification(spec);
      
      expect(result.requirements.length).toBe(3);
      expect(result.requirements[0].priority).toBe('must');
      expect(result.requirements[1].priority).toBe('should');
    });

    it('should handle mixed natural language styles', async () => {
      const spec = `
        I want to create a chat widget that allows users to communicate.
        
        Users need to be able to send messages.
        The system has to store chat history.
        We should support emoji reactions.
        
        When someone sends a message, others should see it immediately.
        If a user is offline, they should get notifications.
      `;

      const result = await parser.parseSpecification(spec);
      
      expect(result.name).toContain('Chat');
      expect(result.requirements.length).toBeGreaterThan(0);
      expect(result.behaviors.length).toBeGreaterThan(0);
    });
  });
});