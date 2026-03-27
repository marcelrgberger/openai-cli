export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<string>;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  async execute(name: string, params: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return tool.execute(params);
  }

  getSchemas(): ToolSchema[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  listNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

export async function createToolRegistry(): Promise<ToolRegistry> {
  const registry = new ToolRegistry();

  const { docReadTool } = await import('./definitions/doc-read.js');
  const { docSummarizeTool } = await import('./definitions/doc-summarize.js');
  const { docSearchTool } = await import('./definitions/doc-search.js');
  const { docIngestTool } = await import('./definitions/doc-ingest.js');
  const { webFetchTool } = await import('./definitions/web-fetch.js');
  const { calculateTool } = await import('./definitions/calculate.js');

  registry.register(docReadTool);
  registry.register(docSummarizeTool);
  registry.register(docSearchTool);
  registry.register(docIngestTool);
  registry.register(webFetchTool);
  registry.register(calculateTool);

  return registry;
}
