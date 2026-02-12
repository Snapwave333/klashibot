
/**
 * AI Response Formatter
 * Cleans, simplifies, and formats AI agent responses for better readability
 */

export interface FormattedSection {
  type: 'header' | 'key-value' | 'metric' | 'reasoning' | 'insight' | 'step' | 'action' | 'code' | 'text' | 'alert';
  content: string;
  label?: string; // For key-value pairs
  color?: string;
}

/**
 * Extract and format steps from AI thinking
 */
export function formatAIResponse(rawText: string): FormattedSection[] {
  const sections: FormattedSection[] = [];

  if (!rawText) return sections;

  // Check for "Brian" Persona Messages
  if (rawText.includes('[Brian]') || rawText.includes('⚡ Trade Executed')) {
    const lines = rawText.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      if (line.includes('Trade Executed') || line.includes('[Brian]')) {
        sections.push({
          type: 'header',
          content: '⚡ Trade Executed',
          color: 'text-neon-green font-bold tracking-wider'
        });
      }
      else if (line.includes('Execution Interrupted')) {
        sections.push({
          type: 'header',
          content: '⚠️ Execution Interrupted',
          color: 'text-neon-red font-bold tracking-wider'
        });
      }
      else if (line.startsWith('Asset:')) {
        sections.push({
          type: 'key-value',
          label: 'ASSET',
          content: line.replace('Asset:', '').trim(),
          color: 'text-white font-mono'
        });
      }
      else if (line.startsWith('Strategy:')) {
        sections.push({
          type: 'key-value',
          label: 'STRATEGY',
          content: line.replace('Strategy:', '').trim(),
          color: 'text-neon-purple font-mono'
        });
      }
      else if (line.startsWith('Confidence:')) {
        sections.push({
          type: 'metric',
          label: 'CONFIDENCE',
          content: line.replace('Confidence:', '').trim(),
          color: 'text-neon-cyan font-bold'
        });
      }
      else if (line.startsWith('Reasoning:') || line.startsWith('Why:')) {
        sections.push({
          type: 'reasoning',
          content: line.replace(/^(Reasoning:|Why:)/, '').trim(),
          color: 'text-gray-300 italic'
        });
      }
      else {
        sections.push({
          type: 'text',
          content: line,
          color: 'text-gray-400'
        });
      }
    });
    
    return sections;
  }

  // Fallback for standard text
  sections.push({
    type: 'text',
    content: rawText,
    color: 'text-gray-300'
  });

  return sections;
}

/**
 * Extracts a short summary from the AI response
 */
export function getAISummary(text: string): string {
    if (!text) return '';
    
    // If it's a trade execution, summarize it
    if (text.includes('Trade Executed')) {
        const assetMatch = text.match(/Asset:\s*(.*)/);
        const sideMatch = text.match(/Side:\s*(.*)/);
        if (assetMatch) {
            return `Executed trade on ${assetMatch[1].trim()}${sideMatch ? ` (${sideMatch[1].trim()})` : ''}`;
        }
        return 'Trade executed successfully';
    }

    // Otherwise return first sentence or truncated text
    const firstLine = text.split('\n')[0];
    if (firstLine.length > 60) {
        return firstLine.substring(0, 60) + '...';
    }
    return firstLine;
}
