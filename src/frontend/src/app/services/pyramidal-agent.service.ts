import { Injectable } from '@angular/core';
import { LangChainService } from './langchain.service';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { LLMProvider } from '../models/langchain-config';
import dedent from "dedent";

/**
 * Email analysis structure
 */
export interface EmailAnalysis {
  language: string;
  hauptbotschaften: string[];
  personen: string[];
  deadlines: string[];
  aktionen: string[];
  details: string[];
  error?: string;
  raw?: string;
}

/**
 * Email structure
 */
export interface EmailStructure {
  headlines: Array<{
    title: string;
    details: string[];
  }>;
  error?: string;
  raw?: string;
}

/**
 * Result of the pyramidal agent processing
 */
export interface PyramidalAgentResult {
  subject: string;
  finalEmail: string;
  analysis: EmailAnalysis;
  structure: EmailStructure;
}

/**
 * Input for the email processing chain
 */
interface EmailInput {
  email: string;
}

/**
 * Input with analysis
 */
interface EmailWithAnalysis extends EmailInput {
  analysis: EmailAnalysis;
}

/**
 * Input with analysis and structure
 */
interface EmailWithStructure extends EmailWithAnalysis {
  structure: EmailStructure;
}

/**
 * Input with analysis, structure, and subject
 */
interface EmailWithSubject extends EmailWithStructure {
  subject: string;
}

/**
 * Complete email result
 */
interface CompleteEmailResult extends EmailWithSubject {
  finalEmail: string;
}

/**
 * Service for processing text using a pyramidal agent flow
 */
@Injectable({
  providedIn: 'root'
})
export class PyramidalAgentService {
  constructor(private langChainService: LangChainService) {}

  /**
   * Process text using the pyramidal agent flow
   * @param email The email text to process
   * @param instructions Optional instructions for processing
   * @returns The processed text result
   */
  async processEmail(email: string, instructions?: string): Promise<PyramidalAgentResult> {
    try {
      console.log('Processing email with pyramidal agent flow', { email, instructions });

      // Get the model from LangChainService
      const model = await this.getModel();

      // Create the email processing chain
      const emailProcessingChain = this.createEmailProcessingChain(model, instructions);

      // Process the email
      const result = await emailProcessingChain.invoke({ email });

      return {
        subject: result.subject,
        finalEmail: result.finalEmail,
        analysis: result.analysis,
        structure: result.structure
      };
    } catch (error) {
      console.error('Error processing email with pyramidal agent flow', error);
      throw error;
    }
  }

  /**
   * Get the model from LangChainService
   * @returns The configured model
   */
  private async getModel(): Promise<ChatOpenAI | ChatAnthropic> {
    const config = this.langChainService.getConfig();

    if (!config.apiKey) {
      throw new Error('API key is not set');
    }

    // Create the model based on the provider
    if (config.provider === LLMProvider.OPENAI) {
      return new ChatOpenAI({
        modelName: config.model,
        openAIApiKey: config.apiKey,
        temperature: 0.1, // Low temperature for more deterministic outputs
      });
    } else if (config.provider === LLMProvider.ANTHROPIC) {
      return new ChatAnthropic({
        modelName: config.model,
        anthropicApiKey: config.apiKey,
        temperature: 0.1, // Low temperature for more deterministic outputs
      });
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Create the email processing chain
   * @param model The model to use
   * @param instructions Optional instructions for processing
   * @returns The email processing chain
   * 
   * Note on dedent and indent:
   * - dedent removes common leading whitespace from multiline strings
   * - indent adds indentation to a multiline string
   * 
   * Example of using indent to add indentation to a specific section:
   * ```
   * const jsonExample = indent(`
   * {
   *   "key": "value",
   *   "nested": {
   *     "array": [1, 2, 3]
   *   }
   * }
   * `, 4); // Indent with 4 spaces
   * 
   * const prompt = PromptTemplate.fromTemplate(dedent`
   *   Here is a JSON example:
   *   
   *   ${jsonExample}
   *   
   *   Please parse this JSON.
   * `);
   * ```
   */
  private createEmailProcessingChain(model: ChatOpenAI | ChatAnthropic, instructions?: string): RunnableSequence {
    // Step 1: Analyze Email
    const analyzeEmail = RunnableLambda.from<EmailInput, EmailWithAnalysis>(async (input) => {
      // Use dedent to remove common leading whitespace
      const prompt = PromptTemplate.fromTemplate(dedent`
        Analysiere diese E-Mail und extrahiere alle wichtigen Informationen. KEINE Inhalte verlieren!

        E-Mail: {email}
        ${instructions ? `Zusätzliche Anweisungen: ${instructions}` : ''}

        Extrahiere als JSON:
        - language: "de" oder "en"
        - hauptbotschaften: [Array der Kernaussagen]
        - personen: [Array aller erwähnten Personen]
        - deadlines: [Array mit Terminen/Fristen]
        - aktionen: [Array erforderlicher Handlungen]
        - details: [Array sonstiger wichtiger Details]

        Nur JSON zurückgeben:
      `);

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const result = await chain.invoke({ email: input.email });

      try {
        const analysis = JSON.parse(result) as EmailAnalysis;
        return { ...input, analysis };
      } catch (e) {
        return { 
          ...input, 
          analysis: { 
            language: 'de', 
            hauptbotschaften: [], 
            personen: [], 
            deadlines: [], 
            aktionen: [], 
            details: [],
            error: "Parse failed", 
            raw: result 
          } 
        };
      }
    });

    // Step 2: Structure with MECE + Pyramidal
    const structureEmail = RunnableLambda.from<EmailWithAnalysis, EmailWithStructure>(async (input) => {
      // Use dedent to remove common leading whitespace
      const prompt = PromptTemplate.fromTemplate(dedent`
        Erstelle pyramidale Struktur mit MECE-Prinzip für diese E-Mail.

        Analyse: {analysis}
        Original: {email}
        ${instructions ? `Zusätzliche Anweisungen: ${instructions}` : ''}

        REGELN:
        - Jede Überschrift ist eine substantielle Kernaussage (NICHT "Nächste Schritte")
        - Jede Überschrift bezeichnet gleichgewichtigen, abgeschlossenen Inhalt
        - Überschriften schließen sich gegenseitig aus (MECE)
        - Geschäftsauswirkung VOR technischen Details
        - Sprache: {language}

        Erstelle JSON:
        {{
          "headlines": [
            {{
              "title": "Substantielle Kernaussage als Überschrift",
              "details": ["Detailpunkt 1", "Detailpunkt 2"]
            }}
          ]
        }}
      `);

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const result = await chain.invoke({
        analysis: JSON.stringify(input.analysis),
        email: input.email,
        language: input.analysis.language || 'de'
      });

      try {
        const structure = JSON.parse(result) as EmailStructure;
        return { ...input, structure };
      } catch (e) {
        return { 
          ...input, 
          structure: { 
            headlines: [],
            error: "Parse failed", 
            raw: result 
          } 
        };
      }
    });

    // Step 3: Generate Subject Line
    const generateSubject = RunnableLambda.from<EmailWithStructure, EmailWithSubject>(async (input) => {
      // Use dedent to remove common leading whitespace
      const prompt = PromptTemplate.fromTemplate(dedent`
        Erstelle informativen Betreff nach diesem exakten Format:
        [Hauptbotschaft] | [Details/Status] | [Erforderliche Aktionen/Deadlines] | [@Personen bei Bedarf]

        Analyse: {analysis}
        Struktur: {structure}
        Sprache: {language}
        ${instructions ? `Zusätzliche Anweisungen: ${instructions}` : ''}

        BEISPIELE:
        - "Projekt Alpha verzögert sich | Ressourcenkonflikt mit Schulungen | Team-Meeting Di erforderlich | @Sarah Feedback bis Do"
        - "Status Update: Budget Q1 | System-Ausfall behoben | @Michael Freigabe nötig | @Lisa Input zu Metriken gewünscht"

        WICHTIG: Informationsdichte über Kürze stellen!

        Nur den Betreff zurückgeben:
      `);

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const subject = await chain.invoke({
        analysis: JSON.stringify(input.analysis),
        structure: JSON.stringify(input.structure),
        language: input.analysis.language || 'de'
      });

      return { ...input, subject: subject.trim() };
    });

    // Step 4: Format Final Email
    const formatEmail = RunnableLambda.from<EmailWithSubject, CompleteEmailResult>(async (input) => {
      // Use dedent to remove common leading whitespace
      const prompt = PromptTemplate.fromTemplate(dedent`
        Formatiere die finale E-Mail nach pyramidaler Struktur:

        Betreff: {subject}
        Struktur: {structure}
        Original Kontext: {email}
        Sprache: {language}
        ${instructions ? `Zusätzliche Anweisungen: ${instructions}` : ''}

        FORMAT:
        - Kurze Begrüßung
        - **Fette Überschriften** mit Bullet Points
        - Extrem kompakt aber vollständig
        - Keine Höflichkeitsfloskeln
        - Professioneller Abschluss
        - Sprache: {language}

        Vollständige formatierte E-Mail:
      `);

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const finalEmail = await chain.invoke({
        subject: input.subject,
        structure: JSON.stringify(input.structure),
        email: input.email,
        language: input.analysis.language || 'de'
      });

      return { ...input, finalEmail: finalEmail.trim() };
    });

    // Chain everything together
    return RunnableSequence.from<EmailInput, CompleteEmailResult>([
      analyzeEmail,
      structureEmail, 
      generateSubject,
      formatEmail
    ]);
  }
}
