# Visual Construct Composer

The Visual Construct Composer is a drag-and-drop visual programming interface for creating constructs by composing them visually. It automatically generates TypeScript/JavaScript code from your visual compositions.

## Features

### 1. **Construct Palette**
- Categorized library of all available constructs (L0, L1, L2, L3)
- Search and filter functionality
- Drag-and-drop construct blocks
- Visual indicators for construct levels
- Expandable/collapsible categories

### 2. **Composition Canvas**
- Drop zone for constructs with auto-layout
- Visual connections between constructs
- Zoom and pan controls with minimap
- Grid snapping for precise placement
- Multi-select and group operations
- Real-time validation indicators

### 3. **Property Editor**
- Configure construct properties
- Type-specific input controls
- Connection management
- Documentation and examples
- Security and cost information

### 4. **Code Generation**
- Real-time TypeScript/JavaScript generation
- Proper import statements
- Dependency ordering
- Export handling
- Installation command generation

### 5. **Validation System**
- Property validation
- Connection type checking
- Circular dependency detection
- Level constraint validation
- Real-time error display

## Usage

### Creating a Composition

1. **Navigate to Visual Composer**
   - Click on "Visual Composer" in the navigation bar

2. **Add Constructs**
   - Browse or search constructs in the left palette
   - Drag constructs onto the canvas
   - Constructs are color-coded by level:
     - L0 (Green): Primitives
     - L1 (Blue): Configured
     - L2 (Purple): Patterns
     - L3 (Amber): Applications

3. **Connect Constructs**
   - Drag from output handles (bottom) to input handles (top)
   - Connections validate type compatibility
   - Invalid connections show warnings

4. **Configure Properties**
   - Click a construct to select it
   - Use the property panel on the right
   - Required properties are marked with asterisks
   - Validation errors appear in real-time

5. **Generate Code**
   - Click the "Generate" button in the toolbar
   - Review the generated code
   - Copy or download the result

### Toolbar Actions

- **Save**: Save composition to local storage
- **Export**: Download composition as JSON
- **Generate**: Create TypeScript code
- **Clear**: Reset the canvas
- **Grid**: Toggle grid display
- **Minimap**: Toggle minimap
- **Code Preview**: Toggle code preview panel

### Validation Rules

1. **Required Properties**: All required construct properties must be configured
2. **Type Compatibility**: Connected inputs/outputs must have compatible types
3. **No Circular Dependencies**: Constructs cannot form circular references
4. **Level Constraints**: 
   - L0 constructs cannot have dependencies
   - Higher levels should not skip intermediate levels

### Best Practices

1. **Start with Primitives**: Build from L0 constructs upward
2. **Name Your Composition**: Give it a meaningful name before saving
3. **Validate Often**: Check for errors before generating code
4. **Document Connections**: Use constructs that clearly indicate data flow
5. **Test Generated Code**: Always test the generated code in your project

## Architecture

### Component Structure

```
VisualComposer/
├── VisualConstructComposer.tsx  # Main component
├── ConstructBlock.tsx           # Draggable construct representation
├── ConstructPalette.tsx         # Construct library sidebar
├── PropertyEditor.tsx           # Property configuration panel
├── CodePreview.tsx              # Generated code viewer
├── CompositionCanvas.tsx        # Canvas wrapper component
├── codeGenerator.ts             # Code generation logic
├── compositionValidator.ts      # Validation logic
└── index.ts                     # Component exports
```

### State Management

The Visual Composer uses:
- React Flow for canvas state and interactions
- Local component state for UI controls
- Zustand store for construct data

### Code Generation Process

1. **Dependency Analysis**: Builds dependency graph from connections
2. **Topological Sort**: Orders constructs by dependencies
3. **Import Generation**: Creates necessary import statements
4. **Component Generation**: Builds React component with proper initialization
5. **Export Generation**: Adds appropriate exports

## Extending the Visual Composer

### Adding New Construct Types

1. Ensure constructs are registered in the construct registry
2. Define proper inputs/outputs in construct definitions
3. Add custom rendering if needed in ConstructBlock

### Custom Validation Rules

Add validation logic in `compositionValidator.ts`:
- Node validation for construct-specific rules
- Connection validation for custom compatibility
- Composition validation for overall constraints

### Enhanced Code Generation

Modify `codeGenerator.ts` to:
- Support additional frameworks
- Add custom code patterns
- Include configuration files
- Generate tests