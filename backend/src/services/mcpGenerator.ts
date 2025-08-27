import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = join(__dirname, '../../../templates/user-mcp')

export interface MCPGenerationOptions {
  projectName: string
  projectPath: string
  includeAuthTools?: boolean
  includeDataTools?: boolean
  includeUITools?: boolean
  customTools?: Array<{
    name: string
    description: string
    category: string
  }>
}

export class MCPGeneratorService {
  /**
   * Generate MCP server files for a user project
   */
  async generateMCPServer(options: MCPGenerationOptions): Promise<void> {
    const mcpPath = join(options.projectPath, 'mcp')
    
    // Create MCP directory structure
    await this.createDirectoryStructure(mcpPath)
    
    // Copy and process template files
    await this.processTemplates(mcpPath, options)
    
    // Update project's mcp.json
    await this.updateMCPConfig(options.projectPath, options.projectName)
  }
  
  /**
   * Create the MCP directory structure
   */
  private async createDirectoryStructure(mcpPath: string): Promise<void> {
    await mkdir(mcpPath, { recursive: true })
    await mkdir(join(mcpPath, 'src'), { recursive: true })
    await mkdir(join(mcpPath, 'src', 'tools'), { recursive: true })
  }
  
  /**
   * Process template files with variable substitution
   */
  private async processTemplates(
    mcpPath: string,
    options: MCPGenerationOptions
  ): Promise<void> {
    // Copy package.json
    await this.copyTemplate(
      'package.json',
      join(mcpPath, 'package.json'),
      options
    )
    
    // Copy tsconfig.json
    await this.copyTemplate(
      'tsconfig.json',
      join(mcpPath, 'tsconfig.json'),
      options
    )
    
    // Copy main server file
    await this.copyTemplate(
      'src/server.ts',
      join(mcpPath, 'src', 'server.ts'),
      options
    )
    
    // Copy README
    await this.copyTemplate(
      'README.md',
      join(mcpPath, 'README.md'),
      options
    )
    
    // Copy selected tool files
    if (options.includeAuthTools !== false) {
      await this.copyTemplate(
        'src/tools/auth.ts',
        join(mcpPath, 'src', 'tools', 'auth.ts'),
        options
      )
    }
    
    if (options.includeDataTools !== false) {
      await this.copyTemplate(
        'src/tools/data.ts',
        join(mcpPath, 'src', 'tools', 'data.ts'),
        options
      )
    }
    
    if (options.includeUITools !== false) {
      await this.copyTemplate(
        'src/tools/ui.ts',
        join(mcpPath, 'src', 'tools', 'ui.ts'),
        options
      )
    }
    
    // Generate custom tools if provided
    if (options.customTools && options.customTools.length > 0) {
      await this.generateCustomTools(mcpPath, options.customTools)
    }
  }
  
  /**
   * Copy a template file with variable substitution
   */
  private async copyTemplate(
    templateFile: string,
    targetFile: string,
    options: MCPGenerationOptions
  ): Promise<void> {
    const templatePath = join(TEMPLATE_DIR, templateFile)
    let content = await readFile(templatePath, 'utf-8')
    
    // Replace template variables
    content = content.replace(/\{\{projectName\}\}/g, options.projectName)
    content = content.replace(/\{\{ProjectName\}\}/g, this.toPascalCase(options.projectName))
    
    await writeFile(targetFile, content)
  }
  
  /**
   * Update or create mcp.json in the project root
   */
  private async updateMCPConfig(
    projectPath: string,
    projectName: string
  ): Promise<void> {
    const mcpConfigPath = join(projectPath, 'mcp.json')
    
    let config: any = {
      mcpServers: {}
    }
    
    // Try to read existing config
    try {
      const existingContent = await readFile(mcpConfigPath, 'utf-8')
      config = JSON.parse(existingContent)
    } catch {
      // File doesn't exist, use default
    }
    
    // Add this project's MCP server
    config.mcpServers[projectName] = {
      command: 'node',
      args: ['mcp/dist/server.js'],
      env: {
        NODE_ENV: 'development'
      }
    }
    
    await writeFile(mcpConfigPath, JSON.stringify(config, null, 2))
  }
  
  /**
   * Generate custom tool files
   */
  private async generateCustomTools(
    mcpPath: string,
    customTools: Array<{ name: string; description: string; category: string }>
  ): Promise<void> {
    // Group tools by category
    const toolsByCategory = customTools.reduce((acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = []
      }
      acc[tool.category]?.push(tool)
      return acc
    }, {} as Record<string, typeof customTools>)
    
    // Generate a file for each category
    for (const [category, tools] of Object.entries(toolsByCategory)) {
      const content = this.generateCustomToolFile(category, tools)
      await writeFile(
        join(mcpPath, 'src', 'tools', `${category}.ts`),
        content
      )
    }
  }
  
  /**
   * Generate content for a custom tool file
   */
  private generateCustomToolFile(
    category: string,
    tools: Array<{ name: string; description: string }>
  ): string {
    return `import { Tool } from '@modelcontextprotocol/sdk/types.js'

export const ${category}Tools: Tool[] = [
${tools.map(tool => `  {
    name: '${category}_${tool.name}',
    description: '${tool.description}',
    inputSchema: {
      type: 'object',
      properties: {
        // TODO: Define input properties
      }
    }
  }`).join(',\n')}
]

export async function execute${this.toPascalCase(category)}Tool(name: string, args: any) {
  switch (name) {
${tools.map(tool => `    case '${category}_${tool.name}':
      // TODO: Implement ${tool.name}
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: '${tool.name} executed'
          }, null, 2)
        }]
      }`).join('\n    \n')}
      
    default:
      throw new Error(\`Unknown ${category} tool: \${name}\`)
  }
}`
  }
  
  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }
  
  /**
   * Check if a project has MCP support
   */
  async hassMCPSupport(projectPath: string): Promise<boolean> {
    try {
      await readFile(join(projectPath, 'mcp.json'), 'utf-8')
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Get MCP configuration for a project
   */
  async getMCPConfig(projectPath: string): Promise<any> {
    try {
      const content = await readFile(join(projectPath, 'mcp.json'), 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }
}

export const mcpGenerator = new MCPGeneratorService()