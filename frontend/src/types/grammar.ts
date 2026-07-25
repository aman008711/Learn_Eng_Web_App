export interface GrammarCheckRecord {
  id: string;
  original_text: string;
  corrected_text: string;
  explanation: string;
  alternatives: string[];
  mistakes_highlighted: string;
  created_at: string;
}
