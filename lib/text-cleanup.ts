/**
 * Text cleanup utilities for BKK data
 */

/**
 * Clean up encoding artifacts in BKK text data
 */
export function cleanBKKText(text: string): string {
  if (!text) return '';
  
  // Common encoding fixes for BKK data using string replacements
  let cleaned = text;
  
  // Fix UTF-8 byte sequences that appear as literal text
  const replacements: Record<string, string> = {
    // En-dash and em-dash
    '\u2013': '–',
    '\u2014': '—',
    
    // Hungarian characters (common UTF-8 issues)
    '\u00C1': 'Á',
    '\u00E1': 'á', 
    '\u00C9': 'É',
    '\u00E9': 'é',
    '\u00CD': 'Í', 
    '\u00ED': 'í',
    '\u00D3': 'Ó',
    '\u00F3': 'ó',
    '\u00D6': 'Ö',
    '\u00F6': 'ö',
    '\u0150': 'Ő',
    '\u0151': 'ő', 
    '\u00DA': 'Ú',
    '\u00FA': 'ú',
    '\u00DC': 'Ü',
    '\u00FC': 'ü',
    '\u0170': 'Ű',
    '\u0171': 'ű',
    
    // Quotation marks
    '\u2019': "'",
    '\u201C': '"', 
    '\u201D': '"',
    '\u2026': '…',
    
    // Raw byte sequences as literal strings
    '\\342\\200\\223': '–',
    '\\303\\201': 'Á',
    '\\303\\232': 'Ú',
    '\\303\\241': 'á',
    '\\303\\251': 'é',
    '\\303\\255': 'í',
    '\\303\\263': 'ó',
    '\\303\\266': 'ö',
    '\\303\\272': 'ú',
    '\\305\\221': 'ő',
    '\\305\\261': 'ű'
  };
  
  // Apply all replacements
  for (const [search, replace] of Object.entries(replacements)) {
    cleaned = cleaned.split(search).join(replace);
  }
  
  // Clean up escape sequences and whitespace
  cleaned = cleaned
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  return cleaned;
}

export default cleanBKKText;