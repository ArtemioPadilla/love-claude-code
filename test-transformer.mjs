import { ConstructTransformer } from './frontend/src/constructs/transformers/ConstructTransformer.ts'

// Test construct with old format
const testConstruct = {
  id: 'test-construct',
  name: 'Test Construct',
  level: 'L2',
  description: 'Test',
  version: '1.0.0',
  author: 'Test',
  category: 'infrastructure', // Single category
  outputs: { // Object format
    api: {
      type: 'string',
      description: 'API endpoint'
    },
    db: {
      type: 'object',
      description: 'Database connection'
    }
  },
  providers: ['aws'],
  tags: ['test'],
  inputs: [],
  examples: [],
  bestPractices: [],
  security: [],
  cost: { baseMonthly: 10, usageFactors: [] },
  c4: { type: 'Component' },
  deployment: { requiredProviders: ['aws'], configSchema: {} }
}

console.log('Before transformation:')
console.log('category:', testConstruct.category)
console.log('categories:', testConstruct.categories)
console.log('outputs:', testConstruct.outputs)
console.log('type:', testConstruct.type)

const transformed = ConstructTransformer.transform(testConstruct)

console.log('\nAfter transformation:')
console.log('category:', transformed.category)
console.log('categories:', transformed.categories)
console.log('outputs:', transformed.outputs)
console.log('type:', transformed.type)