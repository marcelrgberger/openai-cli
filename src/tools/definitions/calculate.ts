import type { ToolDefinition } from '../registry.js';

function safeEval(expr: string): number {
  // Simple recursive descent parser for basic math
  const tokens = expr.replace(/\s/g, '').split('');
  let pos = 0;

  function peek(): string { return tokens[pos] || ''; }
  function next(): string { return tokens[pos++] || ''; }

  function parseNumber(): number {
    let num = '';
    if (peek() === '-') { num += next(); }
    while (/[0-9.]/.test(peek())) { num += next(); }
    if (!num || num === '-') throw new Error('Erwartete Zahl');
    return parseFloat(num);
  }

  function parseFactor(): number {
    if (peek() === '(') {
      next(); // consume (
      const val = parseExpr();
      if (next() !== ')') throw new Error('Erwartete )');
      return val;
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let val = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = next();
      const right = parseFactor();
      val = op === '*' ? val * right : val / right;
    }
    return val;
  }

  function parseExpr(): number {
    let val = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      const right = parseTerm();
      val = op === '+' ? val + right : val - right;
    }
    return val;
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error('Unerwartetes Zeichen: ' + tokens[pos]);
  return result;
}

export const calculateTool: ToolDefinition = {
  name: 'calculate',
  description: 'Fuehrt mathematische Berechnungen aus. Nuetzlich fuer Unterhaltsberechnungen, Steuerberechnungen, Zinsberechnungen, etc.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematischer Ausdruck (Grundrechenarten: +, -, *, /, Klammern)',
      },
      description: {
        type: 'string',
        description: 'Beschreibung der Berechnung',
      },
    },
    required: ['expression'],
  },
  async execute(params) {
    const expression = params.expression as string;
    const desc = params.description as string;

    try {
      const result = safeEval(expression);

      if (!isFinite(result)) {
        return `Fehler: Ergebnis ist keine gueltige Zahl.`;
      }

      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(2);

      return desc
        ? `${desc}: ${expression} = ${formatted}`
        : `${expression} = ${formatted}`;
    } catch (err) {
      return `Berechnungsfehler: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};
