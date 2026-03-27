import { RoleRegistry } from '../roles/registry.js';
import type { RoleDefinition } from '../roles/loader.js';
import { collectStream } from '../llm/client.js';
import { loadSettings } from '../config/settings.js';

export interface TriageResult {
  primaryRole: RoleDefinition | null;
  secondaryRoles: RoleDefinition[];
  confidence: number;
  reasoning: string;
}

const TRIAGE_PROMPT = `Du bist ein Triage-Agent. Analysiere die Frage und Dokumente des Nutzers und bestimme, welcher Fachexperte am besten geeignet ist.

Antworte NUR im folgenden JSON-Format:
{
  "primary": "rolle-id",
  "secondary": ["rolle-id-2"],
  "confidence": 0.9,
  "reasoning": "Kurze Begruendung"
}

Verfuegbare Rollen:
`;

export async function triageQuery(
  query: string,
  documentContext: string,
  roleRegistry: RoleRegistry,
): Promise<TriageResult> {
  // Step 1: Fast keyword matching
  const keywordMatches = roleRegistry.matchByKeywords(query + ' ' + documentContext);

  // If strong keyword match (top match has 3+ triggers), use it directly
  if (keywordMatches.length > 0 && keywordMatches[0].triggers.length >= 3) {
    const primary = roleRegistry.get(keywordMatches[0].roleId)!;
    const secondary = keywordMatches.slice(1, 3)
      .map((m) => roleRegistry.get(m.roleId))
      .filter((r): r is RoleDefinition => r !== undefined);

    return {
      primaryRole: primary,
      secondaryRoles: secondary,
      confidence: 0.85,
      reasoning: `Keyword-Match: ${keywordMatches[0].triggers.join(', ')}`,
    };
  }

  // Step 2: LLM-based classification for ambiguous cases
  try {
    const settings = loadSettings();
    const roles = roleRegistry.getAll();
    const roleList = roles.map((r) => `- ${r.id}: ${r.name} (${r.category})`).join('\n');

    const result = await collectStream({
      model: settings.triageModel,
      messages: [
        {
          role: 'system',
          content: TRIAGE_PROMPT + roleList,
        },
        {
          role: 'user',
          content: `Frage: ${query}\n\nDokument-Kontext: ${documentContext.slice(0, 2000)}`,
        },
      ],
      temperature: 0.1,
      maxTokens: 200,
    });

    const json = JSON.parse(result.text);
    const primary = roleRegistry.get(json.primary) || null;
    const secondary = (json.secondary || [])
      .map((id: string) => roleRegistry.get(id))
      .filter((r: RoleDefinition | undefined): r is RoleDefinition => r !== undefined);

    return {
      primaryRole: primary,
      secondaryRoles: secondary,
      confidence: json.confidence || 0.5,
      reasoning: json.reasoning || '',
    };
  } catch {
    // Fallback to keyword match
    if (keywordMatches.length > 0) {
      return {
        primaryRole: roleRegistry.get(keywordMatches[0].roleId) || null,
        secondaryRoles: [],
        confidence: 0.5,
        reasoning: 'Keyword-basierte Zuordnung (LLM-Triage fehlgeschlagen)',
      };
    }

    return {
      primaryRole: null,
      secondaryRoles: [],
      confidence: 0,
      reasoning: 'Kein passender Experte gefunden',
    };
  }
}
