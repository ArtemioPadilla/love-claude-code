/**
 * Specification Editor Component
 * Allows users to write natural language specifications and convert them to formal specs
 */

import React, { useState, useCallback } from 'react';
import { specificationParser } from '../../services/tdd/SpecificationParser';
import type { ParsedSpecification } from '../../services/tdd/SpecificationParser';
import { PlatformConstructDefinition } from '../../constructs/types';

export interface SpecificationEditorProps {
  onSpecificationParsed?: (spec: ParsedSpecification) => void;
  onConstructGenerated?: (definition: Partial<PlatformConstructDefinition>) => void;
  onTestGenerated?: (testCode: string) => void;
}

export const SpecificationEditor: React.FC<SpecificationEditorProps> = ({
  onSpecificationParsed,
  onConstructGenerated,
  onTestGenerated
}) => {
  const [naturalSpec, setNaturalSpec] = useState('');
  const [parsedSpec, setParsedSpec] = useState<ParsedSpecification | null>(null);
  const [constructDef, setConstructDef] = useState<Partial<PlatformConstructDefinition> | null>(null);
  const [testCode, setTestCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'spec' | 'construct' | 'tests'>('spec');

  const exampleSpecs = [
    {
      name: 'Secure Login Form',
      spec: `Create an L1 secure login form construct for user authentication.

Categories: ui, forms, security, authentication

The form must validate email addresses and passwords securely.
It should implement rate limiting to prevent brute force attacks.
The form must support remember me functionality with secure tokens.
It should integrate with multi-factor authentication when enabled.

Inputs:
- onSubmit callback function
- initialValues object with email and password
- rememberMeEnabled boolean flag
- mfaEnabled boolean flag

Outputs:
- credentials object with validated email and password
- rememberToken string if remember me is checked
- mfaChallenge object if MFA is required

Dependencies: ValidationService, AuthenticationAPI, RateLimiter, TokenManager

Given a user enters invalid email format
When they try to submit the form
Then an email validation error should be displayed

Given a user fails login 5 times
When they try to login again
Then they should be temporarily locked out for 15 minutes

Test that email validation works correctly
Test that password strength requirements are enforced
Verify that rate limiting blocks after 5 failed attempts
Ensure remember me tokens are securely generated`
    },
    {
      name: 'Real-time Data Dashboard',
      spec: `Build an L2 pattern for a real-time data visualization dashboard.

Categories: patterns, ui, data-visualization, real-time

The dashboard must display live data updates within 100ms latency.
It should support multiple chart types including line, bar, and pie charts.
The dashboard must handle up to 1000 data points per second.
It should provide data export functionality in CSV and JSON formats.

Dependencies: WebSocketClient, ChartingLibrary, DataProcessor, ExportService

Performance constraint: Initial render must complete within 2 seconds.
Security constraint: All data must be encrypted in transit.`
    }
  ];

  const parseSpecification = useCallback(async () => {
    setIsProcessing(true);
    try {
      const parsed = await specificationParser.parseSpecification(naturalSpec);
      setParsedSpec(parsed);
      onSpecificationParsed?.(parsed);

      if (parsed.type === 'construct') {
        const definition = await specificationParser.toConstructDefinition(parsed);
        setConstructDef(definition);
        onConstructGenerated?.(definition);
      }

      const generatedTests = await specificationParser.generateTestSuite(parsed);
      setTestCode(generatedTests);
      onTestGenerated?.(generatedTests);

    } catch (error) {
      console.error('Failed to parse specification:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [naturalSpec, onSpecificationParsed, onConstructGenerated, onTestGenerated]);

  const loadExample = (example: typeof exampleSpecs[0]) => {
    setNaturalSpec(example.spec);
    setParsedSpec(null);
    setConstructDef(null);
    setTestCode('');
  };

  return (
    <div className="specification-editor">
      <div className="editor-header">
        <h2>Specification-Driven Development</h2>
        <p>Write natural language specifications and convert them to formal construct definitions and tests</p>
      </div>

      <div className="editor-content">
        <div className="input-section">
          <div className="section-header">
            <h3>Natural Language Specification</h3>
            <div className="example-buttons">
              {exampleSpecs.map((example, index) => (
                <button
                  key={index}
                  className="example-button"
                  onClick={() => loadExample(example)}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            className="spec-input"
            value={naturalSpec}
            onChange={(e) => setNaturalSpec(e.target.value)}
            placeholder="Describe your construct in natural language..."
            rows={15}
          />
          
          <button
            className="parse-button"
            onClick={parseSpecification}
            disabled={!naturalSpec.trim() || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Parse Specification'}
          </button>
        </div>

        {parsedSpec && (
          <div className="output-section">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'spec' ? 'active' : ''}`}
                onClick={() => setActiveTab('spec')}
              >
                Parsed Specification
              </button>
              {parsedSpec.type === 'construct' && (
                <button
                  className={`tab ${activeTab === 'construct' ? 'active' : ''}`}
                  onClick={() => setActiveTab('construct')}
                >
                  Construct Definition
                </button>
              )}
              <button
                className={`tab ${activeTab === 'tests' ? 'active' : ''}`}
                onClick={() => setActiveTab('tests')}
              >
                Generated Tests
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'spec' && (
                <div className="parsed-spec">
                  <div className="spec-header">
                    <h4>{parsedSpec.name}</h4>
                    <div className="spec-meta">
                      <span className="spec-type">{parsedSpec.type}</span>
                      {parsedSpec.level && <span className="spec-level">{parsedSpec.level}</span>}
                      <span className="confidence">
                        Confidence: {Math.round((parsedSpec.metadata?.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="spec-description">
                    <h5>Description</h5>
                    <p>{parsedSpec.description}</p>
                  </div>

                  {parsedSpec.requirements.length > 0 && (
                    <div className="spec-requirements">
                      <h5>Requirements</h5>
                      <ul>
                        {parsedSpec.requirements.map((req) => (
                          <li key={req.id} className={`requirement ${req.priority}`}>
                            <span className="req-id">{req.id}</span>
                            <span className="req-type">{req.type}</span>
                            <span className="req-priority">{req.priority}</span>
                            <span className="req-desc">{req.description}</span>
                            {req.testable && <span className="testable">✓ Testable</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedSpec.behaviors.length > 0 && (
                    <div className="spec-behaviors">
                      <h5>Behaviors (BDD)</h5>
                      {parsedSpec.behaviors.map((behavior) => (
                        <div key={behavior.id} className="behavior">
                          <div className="behavior-id">{behavior.id}</div>
                          <div className="given">
                            <strong>Given:</strong>
                            <ul>
                              {behavior.given.map((g, i) => <li key={i}>{g}</li>)}
                            </ul>
                          </div>
                          <div className="when">
                            <strong>When:</strong>
                            <ul>
                              {behavior.when.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          </div>
                          <div className="then">
                            <strong>Then:</strong>
                            <ul>
                              {behavior.then.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {parsedSpec.inputs && parsedSpec.inputs.length > 0 && (
                    <div className="spec-inputs">
                      <h5>Inputs</h5>
                      <ul>
                        {parsedSpec.inputs.map((input, i) => (
                          <li key={i}>
                            <code>{input.name}: {input.type}</code>
                            {input.required && <span className="required">*</span>}
                            - {input.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedSpec.outputs && parsedSpec.outputs.length > 0 && (
                    <div className="spec-outputs">
                      <h5>Outputs</h5>
                      <ul>
                        {parsedSpec.outputs.map((output, i) => (
                          <li key={i}>
                            <code>{output.name}: {output.type}</code>
                            - {output.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedSpec.dependencies && parsedSpec.dependencies.length > 0 && (
                    <div className="spec-dependencies">
                      <h5>Dependencies</h5>
                      <ul>
                        {parsedSpec.dependencies.map((dep, i) => (
                          <li key={i}>{dep}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedSpec.constraints && parsedSpec.constraints.length > 0 && (
                    <div className="spec-constraints">
                      <h5>Constraints</h5>
                      <ul>
                        {parsedSpec.constraints.map((constraint, i) => (
                          <li key={i} className={`constraint ${constraint.type}`}>
                            <span className="constraint-type">{constraint.type}</span>
                            {constraint.description}
                            {constraint.threshold && constraint.metric && (
                              <span className="metric">
                                {' '}({constraint.threshold} {constraint.metric})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'construct' && constructDef && (
                <div className="construct-definition">
                  <pre>{JSON.stringify(constructDef, null, 2)}</pre>
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="generated-tests">
                  <pre>{testCode}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .specification-editor {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #f5f5f5;
        }

        .editor-header {
          padding: 20px;
          background: white;
          border-bottom: 1px solid #ddd;
        }

        .editor-header h2 {
          margin: 0 0 10px 0;
        }

        .editor-header p {
          margin: 0;
          color: #666;
        }

        .editor-content {
          flex: 1;
          display: flex;
          gap: 20px;
          padding: 20px;
          overflow: hidden;
        }

        .input-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .section-header h3 {
          margin: 0;
        }

        .example-buttons {
          display: flex;
          gap: 10px;
        }

        .example-button {
          padding: 6px 12px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .example-button:hover {
          background: #e0e0e0;
        }

        .spec-input {
          flex: 1;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          resize: none;
          margin-bottom: 15px;
        }

        .parse-button {
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          align-self: flex-start;
        }

        .parse-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .parse-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .output-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #ddd;
        }

        .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 14px;
          color: #666;
        }

        .tab:hover {
          background: #f5f5f5;
        }

        .tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
        }

        .tab-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .parsed-spec {
          font-size: 14px;
        }

        .spec-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .spec-header h4 {
          margin: 0;
          font-size: 20px;
        }

        .spec-meta {
          display: flex;
          gap: 10px;
        }

        .spec-meta span {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .spec-type {
          background: #e3f2fd;
          color: #1976d2;
        }

        .spec-level {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .confidence {
          background: #e8f5e9;
          color: #388e3c;
        }

        .spec-description,
        .spec-requirements,
        .spec-behaviors,
        .spec-inputs,
        .spec-outputs,
        .spec-dependencies,
        .spec-constraints {
          margin-bottom: 25px;
        }

        h5 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .requirement {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          margin-bottom: 5px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .requirement.must {
          border-left: 3px solid #f44336;
        }

        .requirement.should {
          border-left: 3px solid #ff9800;
        }

        .requirement.could {
          border-left: 3px solid #03a9f4;
        }

        .req-id,
        .req-type,
        .req-priority {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
        }

        .req-id {
          background: #e0e0e0;
          font-family: monospace;
        }

        .req-type {
          background: #fff3cd;
          color: #856404;
        }

        .req-priority {
          background: #d1ecf1;
          color: #0c5460;
          text-transform: uppercase;
        }

        .testable {
          color: #4caf50;
          font-weight: bold;
        }

        .behavior {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 10px;
        }

        .behavior-id {
          font-family: monospace;
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
        }

        .given, .when, .then {
          margin-bottom: 10px;
        }

        .given strong,
        .when strong,
        .then strong {
          color: #333;
        }

        .constraint {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          margin-bottom: 5px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .constraint-type {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
          background: #e0e0e0;
        }

        .metric {
          color: #666;
          font-style: italic;
        }

        pre {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 13px;
          line-height: 1.5;
        }

        code {
          background: #f0f0f0;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 13px;
        }

        .required {
          color: #f44336;
          font-weight: bold;
        }

        ul {
          margin: 0;
          padding-left: 20px;
        }

        li {
          margin-bottom: 5px;
        }
      `}</style>
    </div>
  );
};