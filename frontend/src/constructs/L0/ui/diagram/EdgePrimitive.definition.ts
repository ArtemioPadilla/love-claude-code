import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../../types'

/**
 * Edge Primitive Definition
 * Foundation for all diagram edge/connection visualization
 */
export const edgePrimitiveDefinition: PlatformConstructDefinition = {
  id: 'platform-l0-edge-primitive',
  name: 'Edge Primitive',
  level: ConstructLevel.L0,
  type: ConstructType.UI,
  description: 'Raw diagram edge element with bezier curve rendering',
  version: '1.0.0',
  author: 'Love Claude Code',
  categories: ['ui', 'visualization', 'diagram'],
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  tags: ['edge', 'primitive', 'diagram', 'connection', 'bezier', 'svg', 'canvas'],
  inputs: [
    {
      name: 'id',
      type: 'string',
      description: 'Unique identifier for the edge',
      required: true
    },
    {
      name: 'source',
      type: 'object',
      description: 'Source connection point',
      required: true,
      schema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          portId: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' }
        },
        required: ['x', 'y']
      }
    },
    {
      name: 'target',
      type: 'object',
      description: 'Target connection point',
      required: true,
      schema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          portId: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' }
        },
        required: ['x', 'y']
      }
    },
    {
      name: 'controlPoints',
      type: 'array',
      description: 'Bezier curve control points',
      required: false,
      defaultValue: [],
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' }
          },
          required: ['x', 'y']
        }
      }
    },
    {
      name: 'label',
      type: 'string',
      description: 'Text label for the edge',
      required: false
    },
    {
      name: 'labelPosition',
      type: 'number',
      description: 'Position along the edge (0-1) for label placement',
      required: false,
      defaultValue: 0.5,
      validation: {
        min: 0,
        max: 1
      }
    },
    {
      name: 'arrowHead',
      type: 'string',
      description: 'Arrow head style',
      required: false,
      defaultValue: 'arrow',
      validation: {
        enum: ['none', 'arrow', 'circle', 'square', 'diamond']
      }
    },
    {
      name: 'arrowTail',
      type: 'string',
      description: 'Arrow tail style',
      required: false,
      defaultValue: 'none',
      validation: {
        enum: ['none', 'arrow', 'circle', 'square', 'diamond']
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
          stroke: { type: 'string' },
          strokeWidth: { type: 'number' },
          strokeDasharray: { type: 'string' },
          strokeLinecap: { type: 'string', enum: ['butt', 'round', 'square'] },
          strokeLinejoin: { type: 'string', enum: ['miter', 'round', 'bevel'] },
          opacity: { type: 'number' }
        }
      }
    },
    {
      name: 'animated',
      type: 'boolean',
      description: 'Whether to show animation along the edge',
      required: false,
      defaultValue: false
    },
    {
      name: 'animationSpeed',
      type: 'number',
      description: 'Animation speed in seconds',
      required: false,
      defaultValue: 2
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
      description: 'Custom data attached to the edge',
      required: false
    },
    {
      name: 'selectable',
      type: 'boolean',
      description: 'Whether the edge can be selected',
      required: false,
      defaultValue: true
    },
    {
      name: 'hitAreaWidth',
      type: 'number',
      description: 'Width of the clickable area around the edge',
      required: false,
      defaultValue: 10
    }
  ],
  outputs: [
    {
      name: 'edgeElement',
      type: 'SVGElement | HTMLCanvasElement',
      description: 'The rendered edge element'
    },
    {
      name: 'path',
      type: 'string',
      description: 'SVG path data for the edge'
    },
    {
      name: 'length',
      type: 'number',
      description: 'Total length of the edge path'
    },
    {
      name: 'midpoint',
      type: 'object',
      description: 'Coordinates of the edge midpoint',
      schema: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          angle: { type: 'number' }
        }
      }
    },
    {
      name: 'bounds',
      type: 'object',
      description: 'Bounding box of the edge',
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
      name: 'isSelected',
      type: 'boolean',
      description: 'Current selection state'
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
      title: 'Simple Straight Edge',
      description: 'Basic edge connecting two points',
      code: `const edge = new EdgePrimitive()
await edge.initialize({
  id: 'edge-1',
  source: { x: 100, y: 100 },
  target: { x: 300, y: 200 },
  arrowHead: 'arrow'
})`,
      language: 'typescript'
    },
    {
      title: 'Bezier Curve Edge',
      description: 'Curved edge with control points',
      code: `const edge = new EdgePrimitive()
await edge.initialize({
  id: 'edge-2',
  source: { nodeId: 'node1', portId: 'out', x: 200, y: 100 },
  target: { nodeId: 'node2', portId: 'in', x: 400, y: 300 },
  controlPoints: [
    { x: 300, y: 100 },
    { x: 300, y: 300 }
  ],
  label: 'data flow',
  style: {
    stroke: '#2196f3',
    strokeWidth: 2,
    strokeDasharray: '5,5'
  }
})`,
      language: 'typescript'
    },
    {
      title: 'Animated Edge',
      description: 'Edge with flowing animation',
      code: `const edge = new EdgePrimitive()
await edge.initialize({
  id: 'edge-3',
  source: { x: 100, y: 200 },
  target: { x: 500, y: 200 },
  animated: true,
  animationSpeed: 1.5,
  arrowHead: 'circle',
  arrowTail: 'square',
  style: {
    stroke: '#4caf50',
    strokeWidth: 3,
    opacity: 0.8
  }
})`,
      language: 'typescript'
    }
  ],
  bestPractices: [
    'This is a primitive - use L1 StyledEdge for production features',
    'No built-in edge routing algorithms',
    'No automatic label positioning optimization',
    'Control points must be manually calculated',
    'Hit detection uses simple distance calculation',
    'Animation is basic CSS/Canvas based'
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
    timeToCreate: 60,
    canBuildConstructs: false
  }
}