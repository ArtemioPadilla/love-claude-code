import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../../types'

/**
 * Node Primitive Definition
 * Foundation for all diagram node visualization
 */
export const nodePrimitiveDefinition: PlatformConstructDefinition = {
  id: 'platform-l0-node-primitive',
  name: 'Node Primitive',
  level: ConstructLevel.L0,
  type: ConstructType.UI,
  description: 'Raw diagram node element with flexible rendering support',
  version: '1.0.0',
  author: 'Love Claude Code',
  categories: ['ui', 'visualization', 'diagram'],
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  tags: ['node', 'primitive', 'diagram', 'visualization', 'svg', 'canvas'],
  inputs: [
    {
      name: 'id',
      type: 'string',
      description: 'Unique identifier for the node',
      required: true
    },
    {
      name: 'position',
      type: 'object',
      description: 'Node position coordinates',
      required: true,
      schema: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' }
        },
        required: ['x', 'y']
      }
    },
    {
      name: 'size',
      type: 'object',
      description: 'Node dimensions',
      required: false,
      defaultValue: { width: 100, height: 50 },
      schema: {
        type: 'object',
        properties: {
          width: { type: 'number' },
          height: { type: 'number' }
        },
        required: ['width', 'height']
      }
    },
    {
      name: 'shape',
      type: 'string',
      description: 'Node shape type',
      required: false,
      defaultValue: 'rect',
      validation: {
        enum: ['rect', 'circle', 'diamond', 'hexagon', 'ellipse']
      }
    },
    {
      name: 'text',
      type: 'string',
      description: 'Text content to display in the node',
      required: false
    },
    {
      name: 'icon',
      type: 'string',
      description: 'Icon identifier or path',
      required: false
    },
    {
      name: 'ports',
      type: 'array',
      description: 'Connection ports for edges',
      required: false,
      defaultValue: [],
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            position: { type: 'string', enum: ['top', 'right', 'bottom', 'left'] },
            offset: { type: 'number' }
          },
          required: ['id', 'position']
        }
      }
    },
    {
      name: 'style',
      type: 'object',
      description: 'Visual styling options',
      required: false,
      defaultValue: {},
      schema: {
        type: 'object',
        properties: {
          fill: { type: 'string' },
          stroke: { type: 'string' },
          strokeWidth: { type: 'number' },
          shadow: { type: 'boolean' },
          cornerRadius: { type: 'number' }
        }
      }
    },
    {
      name: 'renderMode',
      type: 'string',
      description: 'Rendering technology',
      required: false,
      defaultValue: 'svg',
      validation: {
        enum: ['svg', 'canvas']
      }
    },
    {
      name: 'data',
      type: 'object',
      description: 'Custom data attached to the node',
      required: false
    },
    {
      name: 'draggable',
      type: 'boolean',
      description: 'Whether the node can be dragged',
      required: false,
      defaultValue: true
    },
    {
      name: 'selectable',
      type: 'boolean',
      description: 'Whether the node can be selected',
      required: false,
      defaultValue: true
    }
  ],
  outputs: [
    {
      name: 'nodeElement',
      type: 'SVGElement | HTMLCanvasElement',
      description: 'The rendered node element'
    },
    {
      name: 'bounds',
      type: 'object',
      description: 'Bounding box of the node',
      schema: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      }
    },
    {
      name: 'portPositions',
      type: 'object',
      description: 'Absolute positions of all ports',
      schema: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' }
          }
        }
      }
    },
    {
      name: 'isSelected',
      type: 'boolean',
      description: 'Current selection state'
    },
    {
      name: 'isDragging',
      type: 'boolean',
      description: 'Current dragging state'
    }
  ],
  security: [],
  cost: {
    baseMonthly: 0,
    usageFactors: []
  },
  c4: {
    type: 'Component',
    technology: 'React/SVG/Canvas'
  },
  examples: [
    {
      title: 'Basic Rectangle Node',
      description: 'Simple rectangular node with text',
      code: `const node = new NodePrimitive()
await node.initialize({
  id: 'node-1',
  position: { x: 100, y: 100 },
  text: 'My Node',
  shape: 'rect'
})`,
      language: 'typescript'
    },
    {
      title: 'Node with Ports',
      description: 'Node with connection ports for edges',
      code: `const node = new NodePrimitive()
await node.initialize({
  id: 'node-2',
  position: { x: 200, y: 200 },
  text: 'Service',
  shape: 'hexagon',
  ports: [
    { id: 'in', position: 'left', offset: 0.5 },
    { id: 'out', position: 'right', offset: 0.5 }
  ],
  style: {
    fill: '#e3f2fd',
    stroke: '#1976d2',
    strokeWidth: 2
  }
})`,
      language: 'typescript'
    },
    {
      title: 'Canvas-rendered Node',
      description: 'High-performance canvas rendering',
      code: `const node = new NodePrimitive()
await node.initialize({
  id: 'node-3',
  position: { x: 300, y: 300 },
  size: { width: 120, height: 60 },
  text: 'Canvas Node',
  renderMode: 'canvas',
  style: {
    fill: '#f5f5f5',
    stroke: '#666',
    shadow: true
  }
})`,
      language: 'typescript'
    }
  ],
  bestPractices: [
    'This is a primitive - use L1 StyledNode for production features',
    'No built-in animations or transitions',
    'No automatic layout or positioning',
    'Provides raw rendering capabilities only',
    'Port positions are calculated based on shape and position',
    'Text wrapping must be handled by higher-level constructs'
  ],
  deployment: {
    requiredProviders: [],
    configSchema: {},
    environmentVariables: []
  },
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'manual',
    vibeCodingPercentage: 0,
    builtWith: [],
    timeToCreate: 45,
    canBuildConstructs: false
  }
}