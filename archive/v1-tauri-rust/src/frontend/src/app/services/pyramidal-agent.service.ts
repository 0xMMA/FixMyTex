import { Injectable } from '@angular/core';
import { LangChainService } from './langchain.service';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";
import {JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda, RunnableSequence, RunnableParallel } from "@langchain/core/runnables";
import dedent from "dedent";
import { BedrockChat } from "@langchain/community/chat_models/bedrock/web";
import {ChatOllama} from "@langchain/ollama";

/**
 * Document types for different output formats
 */
export enum DocumentType {
  EMAIL = 'email',
  WIKI = 'wiki',
  POWERPOINT = 'powerpoint',
  MEMO = 'memo',
  AUTO = 'auto' // Let the system detect
}

/**
 * Document type information
 */
export interface DocumentTypeInfo {
  documentType: DocumentType;
  language: string;
  confidence: number;
}

/**
 * Document structure
 */
export interface DocumentStructure {
  headlines: Array<{
    title: string;
    details: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  error?: string;
  raw?: string;
}

/**
 * Format-specific elements (varies by document type)
 */
export interface FormatElements {
  subject?: string; // For emails
  title?: string; // For wikis, memos
  slideTitle?: string; // For PowerPoint
  summary?: string; // For all types
  error?: string;
  raw?: string;
}

/**
 * Quality assurance check
 */
export interface QualityCheck {
  informationLoss: string[];
  accuracyIssues: string[];
  missingElements: string[];
  overallScore: number;
  passed: boolean;
}

/**
 * Oneshot Foundation Generator Result
 */
export interface OneshotResult {
  subject: string;
  headers: string[];
  fullDocument: string;
  documentType: DocumentType;
  language: string;
  confidence: number;
}

/**
 * Specialist Refinement Results
 */
export interface SpecialistRefinement {
  subjectSpecialist?: {
    improvedSubject: string;
    changeLog: string[];
    confidence: number;
  };
  headerStructureSpecialist?: {
    improvedHeaders: string[];
    meceValidation: string;
    structureIssues: string[];
    confidence: number;
  };
  informationCompletenessSpecialist?: {
    missingInfo: string[];
    preservationStatus: string;
    riskScore: number;
    confidence: number;
  };
  styleLanguageSpecialist?: {
    styleIssues: string[];
    toneAdjustments: string[];
    suggestions: string[];
    confidence: number;
  };
}

/**
 * Complete result
 */
export interface PyramidalAgentResult {
  documentType: DocumentType;
  language: string;
  formatElements: FormatElements;
  finalDocument: string;
  subject: string;
  appliedImprovements: string[];
  qualityScore: number;
  structure: DocumentStructure;
  qualityCheck: QualityCheck;
  intermediateSteps?: {
    oneshot?: OneshotResult;
    refinements?: SpecialistRefinement;
  };
}

/**
 * Input interfaces for the chain
 */
interface DocumentInput {
  text: string;
  documentType?: DocumentType;
  sourceApp?: string;
  instructions?: string;
}

/**
 * Complete document output from the processing chain
 */
interface CompleteDocument {
  documentType: DocumentType;
  language: string;
  formatElements: FormatElements;
  finalDocument: string;
  subject: string;
  appliedImprovements: string[];
  qualityScore: number;
  structure: DocumentStructure;
  qualityCheck: QualityCheck;
  intermediateSteps?: {
    oneshot: OneshotResult;
    refinements: SpecialistRefinement;
  };
}

/**
 * PyramidalAgentService implements a Generate-then-Refine architecture for text enhancement.
 * 
 * Architecture:
 * 1. Document Type Detection: Determines the type of document to be processed
 *    - Uses AI analysis if document type is set to "auto"
 *    - Uses the specified document type otherwise
 *    - Supports email, wiki, memo, and PowerPoint document types
 * 
 * 2. Oneshot Foundation Generator: Creates a high-quality baseline document using document type-specific prompts
 *    - Selects the appropriate prompt template based on the detected or specified document type
 *    - Converts input text into a structured document with subject, headers, and content
 *    - Preserves the quality of the basic pyramidal prompt
 *    - Outputs JSON with subject, headers, fullDocument, documentType, language, and confidence
 * 
 * 3. Parallel Specialist Agents: Analyze and improve specific aspects of the document
 *    - Subject Line Specialist: Validates and improves the subject line format and information density
 *    - Header Structure Specialist: Validates MECE principle and improves headers structure
 *    - Information Completeness Specialist: Checks for information loss between original and processed text
 *    - Style & Language Specialist: Ensures language consistency and professional tone
 * 
 * 4. Integration Coordinator: Selectively applies specialist improvements based on confidence
 *    - Only applies improvements with high confidence (> 0.7)
 *    - Prioritizes completeness fixes for high information loss risk
 *    - Preserves baseline quality when in doubt
 * 
 * This hybrid approach preserves the quality of the oneshot prompt while adding targeted improvements.
 * The service is designed to be robust, with fallbacks at each stage to ensure a quality result even
 * if individual specialists fail. Each document type has its own specialized prompt template to ensure
 * optimal formatting and structure for the specific use case.
 * 
 * Language handling:
 * The service automatically detects the language of the input text and preserves it throughout the processing.
 * It supports multiple languages, not just German and English, and ensures that the output maintains
 * the original language of the input text.
 */
@Injectable({
  providedIn: 'root'
})
export class PyramidalAgentService {
  constructor(private langChainService: LangChainService) {}

  async processDocument(text: string, documentType: DocumentType = DocumentType.AUTO, sourceApp?: string, instructions?: string): Promise<PyramidalAgentResult> {
    const startTime = new Date();
    try {
      console.log(`[processDocument] Starting at ${startTime.toISOString()}`);
      console.log('Processing document with pyramidal agent flow', { text, documentType, sourceApp, instructions });

      const model = await this.langChainService.getModel();
      const processingChain = this.createProcessingChain(model, instructions);

      const result = await processingChain.invoke({
        text,
        documentType: documentType === DocumentType.AUTO ? undefined : documentType,
        sourceApp,
        instructions
      });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.log(`[processDocument] Completed at ${endTime.toISOString()}, total duration: ${duration}ms`);

      return {
        documentType: result.documentType,
        language: result.language,
        formatElements: result.formatElements,
        finalDocument: result.finalDocument,
        subject: result.subject,
        appliedImprovements: result.appliedImprovements,
        qualityScore: result.qualityScore,
        structure: result.structure,
        qualityCheck: result.qualityCheck,
        intermediateSteps: {
          oneshot: result.intermediateSteps?.oneshot,
          refinements: result.intermediateSteps?.refinements
        }
      };
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.error(`[processDocument] Failed at ${endTime.toISOString()}, duration: ${duration}ms`);
      console.error('Error processing document with pyramidal agent flow', error);
      throw error;
    }
  }


  /**
   * Creates the Subject Line Specialist agent
   */
  private createSubjectLineSpecialist(model: ChatOpenAI | ChatAnthropic | BedrockChat | ChatOllama): RunnableLambda<OneshotResult, SpecialistRefinement['subjectSpecialist']> {
    return RunnableLambda.from(async (oneshotResult: OneshotResult) => {
      console.log(`[subjectLineSpecialist] Starting analysis`);
      const startTime = new Date();

      try {
        const prompt = PromptTemplate.fromTemplate(dedent`
          You are a Subject Line Specialist. Analyze and improve the subject line for maximum information density and clarity.

          Original Subject: {subject}
          Document Type: {documentType}
          Language: {language}

          VALIDATION CRITERIA:
          1. Format: Check if it follows "[Hauptbotschaft] | [Details/Status] | [Aktionen] | [@Personen]" format
          2. Information Density: Evaluate balance between information and readability
          3. Core Message Representation: Ensure all key messages are represented
          4. Clarity: Ensure the subject is clear and understandable

          RETURN ONLY JSON:
          {{
            "improvedSubject": "Improved subject line following the format",
            "changeLog": ["Change 1: Reason", "Change 2: Reason"],
            "confidence": 0.9
          }}
        `);

        const chain = prompt.pipe(model).pipe(new JsonOutputParser());
        const result = await chain.invoke({
          subject: oneshotResult.subject,
          documentType: oneshotResult.documentType,
          language: oneshotResult.language
        });

        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.log(`[subjectLineSpecialist] Completed in ${duration}ms`);

        return result;
      } catch (error) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.error(`[subjectLineSpecialist] Failed after ${duration}ms`, error);

        return {
          improvedSubject: oneshotResult.subject,
          changeLog: ["Error: Could not analyze subject line"],
          confidence: 0
        };
      }
    });
  }

  /**
   * Creates the Header Structure Specialist agent
   */
  private createHeaderStructureSpecialist(model: ChatOpenAI | ChatAnthropic | BedrockChat | ChatOllama): RunnableLambda<OneshotResult, SpecialistRefinement['headerStructureSpecialist']> {
    return RunnableLambda.from(async (oneshotResult: OneshotResult) => {
      console.log(`[headerStructureSpecialist] Starting analysis`);
      const startTime = new Date();

      try {
        const prompt = PromptTemplate.fromTemplate(dedent`
          You are a Header Structure Specialist. Analyze and improve the document headers for MECE principle compliance and pyramidal structure.

          Original Headers: {headers}
          Document Type: {documentType}
          Language: {language}
          Full Document: {fullDocument}

          VALIDATION CRITERIA:
          1. MECE Principle: Headers should be Mutually Exclusive, Collectively Exhaustive
          2. Standalone Understanding: Each header should be understandable on its own
          3. Header Type: Identify process headers vs. content headers
          4. Pyramidal Structure: Business impact should come before technical details

          RETURN ONLY JSON:
          {{
            "improvedHeaders": ["Improved Header 1", "Improved Header 2"],
            "meceValidation": "Analysis of MECE compliance",
            "structureIssues": ["Issue 1", "Issue 2"],
            "confidence": 0.9
          }}
        `);

        const chain = prompt.pipe(model).pipe(new JsonOutputParser());
        const result = await chain.invoke({
          headers: JSON.stringify(oneshotResult.headers),
          documentType: oneshotResult.documentType,
          language: oneshotResult.language,
          fullDocument: oneshotResult.fullDocument
        });

        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.log(`[headerStructureSpecialist] Completed in ${duration}ms`);

        return result;
      } catch (error) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.error(`[headerStructureSpecialist] Failed after ${duration}ms`, error);

        return {
          improvedHeaders: oneshotResult.headers,
          meceValidation: "Error: Could not validate MECE principle",
          structureIssues: ["Error: Could not analyze header structure"],
          confidence: 0
        };
      }
    });
  }

  /**
   * Creates the Information Completeness Specialist agent
   */
  private createInformationCompletenessSpecialist(model: ChatOpenAI | ChatAnthropic | BedrockChat | ChatOllama): RunnableLambda<{oneshotResult: OneshotResult, originalText: string}, SpecialistRefinement['informationCompletenessSpecialist']> {
    return RunnableLambda.from(async (input: {oneshotResult: OneshotResult, originalText: string}) => {
      console.log(`[informationCompletenessSpecialist] Starting analysis`);
      const startTime = new Date();

      try {
        const prompt = PromptTemplate.fromTemplate(dedent`
          You are an Information Completeness Specialist. Compare the original text with the processed output to identify any information loss.

          Original Text: {originalText}
          Processed Document: {processedDocument}

          VALIDATION CRITERIA:
          1. People: Identify any people mentioned in original but missing in output
          2. Deadlines: Check for missing deadlines or time constraints
          3. Actions: Verify all required actions are preserved
          4. Technical Details: Ensure important technical details are not lost

          Calculate an information loss risk score (0-1):
          - 0: No information loss
          - 0.5: Some non-critical information lost
          - 1: Critical information lost

          RETURN ONLY JSON:
          {{
            "missingInfo": ["Missing info 1", "Missing info 2"],
            "preservationStatus": "Analysis of information preservation",
            "riskScore": 0.2,
            "confidence": 0.9
          }}
        `);

        const chain = prompt.pipe(model).pipe(new JsonOutputParser());
        const result = await chain.invoke({
          originalText: input.originalText,
          processedDocument: input.oneshotResult.fullDocument
        });

        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.log(`[informationCompletenessSpecialist] Completed in ${duration}ms`);

        return result;
      } catch (error) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.error(`[informationCompletenessSpecialist] Failed after ${duration}ms`, error);

        return {
          missingInfo: ["Error: Could not analyze information completeness"],
          preservationStatus: "Unknown",
          riskScore: 0.5, // Middle value as we don't know
          confidence: 0
        };
      }
    });
  }

  /**
   * Creates the Style & Language Specialist agent
   */
  private createStyleLanguageSpecialist(model: ChatOpenAI | ChatAnthropic | BedrockChat | ChatOllama): RunnableLambda<OneshotResult, SpecialistRefinement['styleLanguageSpecialist']> {
    return RunnableLambda.from(async (oneshotResult: OneshotResult) => {
      console.log(`[styleLanguageSpecialist] Starting analysis`);
      const startTime = new Date();

      try {
        const prompt = PromptTemplate.fromTemplate(dedent`
          You are a Style & Language Specialist. Analyze the document for language consistency, professional tone, and formatting.

          Document: {document}
          Language: {language}
          Document Type: {documentType}

          VALIDATION CRITERIA:
          1. Language Consistency: Ensure consistent use of {language} throughout
          2. Professional Tone: Verify the tone is appropriate for business communication
          3. Formatting: Check for bold headers, proper bullet points, and overall structure

          RETURN ONLY JSON:
          {{
            "styleIssues": ["Style issue 1", "Style issue 2"],
            "toneAdjustments": ["Tone adjustment 1", "Tone adjustment 2"],
            "suggestions": ["Suggestion 1", "Suggestion 2"],
            "confidence": 0.9
          }}
        `);

        const chain = prompt.pipe(model).pipe(new JsonOutputParser());
        const result = await chain.invoke({
          document: oneshotResult.fullDocument,
          language: oneshotResult.language,
          documentType: oneshotResult.documentType
        });

        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.log(`[styleLanguageSpecialist] Completed in ${duration}ms`);

        return result;
      } catch (error) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.error(`[styleLanguageSpecialist] Failed after ${duration}ms`, error);

        return {
          styleIssues: ["Error: Could not analyze style"],
          toneAdjustments: ["Error: Could not analyze tone"],
          suggestions: ["Error: Could not generate suggestions"],
          confidence: 0
        };
      }
    });
  }

  /**
   * Creates the Integration Coordinator to selectively apply specialist improvements
   */
  private createIntegrationCoordinator(): RunnableLambda<{
    oneshotResult: OneshotResult,
    refinements: SpecialistRefinement,
    originalText: string
  }, {
    finalDocument: string,
    subject: string,
    appliedImprovements: string[],
    qualityScore: number,
    intermediateResults: {
      oneshot: OneshotResult,
      refinements: SpecialistRefinement
    }
  }> {
    return RunnableLambda.from(async (input) => {
      console.log(`[integrationCoordinator] Starting integration`);
      const startTime = new Date();

      const { oneshotResult, refinements, originalText } = input;
      const appliedImprovements: string[] = [];
      let finalDocument = oneshotResult.fullDocument;
      let subject = oneshotResult.subject;
      let qualityScore = oneshotResult.confidence;

      try {
        // Apply Subject Line Specialist improvements if confidence > 0.7
        if (refinements.subjectSpecialist && refinements.subjectSpecialist.confidence > 0.7) {
          subject = refinements.subjectSpecialist.improvedSubject;
          appliedImprovements.push(`Subject: ${refinements.subjectSpecialist.changeLog.join(', ')}`);
          console.log(`[integrationCoordinator] Applied subject improvements`);
        }

        // Apply Header Structure Specialist improvements if confidence > 0.7 or MECE violations exist
        if (refinements.headerStructureSpecialist) {
          const hasMeceViolations = refinements.headerStructureSpecialist.meceValidation.toLowerCase().includes('violation') ||
                                   refinements.headerStructureSpecialist.structureIssues.length > 0;

          if (refinements.headerStructureSpecialist.confidence > 0.7 || hasMeceViolations) {
            // We need to replace headers in the document
            let updatedDocument = finalDocument;
            const originalHeaders = oneshotResult.headers;
            const improvedHeaders = refinements.headerStructureSpecialist.improvedHeaders;

            // Replace each header in the document
            for (let i = 0; i < Math.min(originalHeaders.length, improvedHeaders.length); i++) {
              updatedDocument = updatedDocument.replace(
                new RegExp(`\\*\\*${originalHeaders[i]}\\*\\*`, 'g'), 
                `**${improvedHeaders[i]}**`
              );
            }

            finalDocument = updatedDocument;
            appliedImprovements.push(`Headers: Applied MECE structure improvements`);
            console.log(`[integrationCoordinator] Applied header structure improvements`);
          }
        }

        // Prioritize completeness fixes if info loss risk > 0.3
        if (refinements.informationCompletenessSpecialist && 
            refinements.informationCompletenessSpecialist.riskScore > 0.3) {
          // We need to address missing information
          // This is a complex operation that might require regenerating the document
          // For now, we'll just add a note about missing information
          if (refinements.informationCompletenessSpecialist.missingInfo.length > 0) {
            const missingInfoNote = `\n\nNOTE: Additional information from original text:\n${
              refinements.informationCompletenessSpecialist.missingInfo.map(info => `- ${info}`).join('\n')
            }`;

            finalDocument += missingInfoNote;
            appliedImprovements.push(`Completeness: Added missing information`);
            console.log(`[integrationCoordinator] Added missing information note`);
          }
        }

        // Apply Style & Language Specialist improvements if confidence > 0.7
        if (refinements.styleLanguageSpecialist && refinements.styleLanguageSpecialist.confidence > 0.7) {
          // Apply style and tone adjustments if needed
          // This is also complex and might require regenerating parts of the document
          // For now, we'll just track that we considered these improvements
          if (refinements.styleLanguageSpecialist.toneAdjustments.length > 0 ||
              refinements.styleLanguageSpecialist.suggestions.length > 0) {
            appliedImprovements.push(`Style: Applied tone and style improvements`);
            console.log(`[integrationCoordinator] Considered style improvements`);

            // In a more sophisticated implementation, we would apply these improvements
            // to the document text directly
          }
        }

        // Calculate final quality score
        // Base it on oneshot confidence but adjust based on improvements
        qualityScore = oneshotResult.confidence;
        if (appliedImprovements.length > 0) {
          // Increase quality score based on number of improvements
          qualityScore = Math.min(1.0, qualityScore + (appliedImprovements.length * 0.05));
        }

        // If information completeness specialist found high risk, reduce quality score
        if (refinements.informationCompletenessSpecialist && 
            refinements.informationCompletenessSpecialist.riskScore > 0.5) {
          qualityScore = Math.max(0.0, qualityScore - 0.1);
        }

        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.log(`[integrationCoordinator] Completed in ${duration}ms with ${appliedImprovements.length} improvements`);

        return {
          finalDocument,
          subject,
          appliedImprovements,
          qualityScore,
          intermediateResults: {
            oneshot: oneshotResult,
            refinements
          }
        };
      } catch (error) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.error(`[integrationCoordinator] Failed after ${duration}ms`, error);

        // Fallback to oneshot result if integration fails
        return {
          finalDocument: oneshotResult.fullDocument,
          subject: oneshotResult.subject,
          appliedImprovements: ["Error: Integration failed, using oneshot result"],
          qualityScore: oneshotResult.confidence,
          intermediateResults: {
            oneshot: oneshotResult,
            refinements
          }
        };
      }
    });
  }

  /**
   * Detects the document type from the input text
   * @param model The language model to use
   * @param text The input text
   * @returns The detected document type information
   */
  private async detectDocumentType(model: ChatOpenAI | ChatAnthropic | BedrockChat | ChatOllama, text: string): Promise<DocumentTypeInfo> {
    console.log(`[detectDocumentType] Starting analysis`);
    const startTime = new Date();

    try {
      const prompt = PromptTemplate.fromTemplate(dedent`
        Analyze this text and determine the document type and base language.

        Text: {text}

        Determine:
        1. documentType: "email", "wiki", "powerpoint", "memo" (based on content/context)
        2. language: "de", "en", etc.
        3. confidence: 0-1 (confidence in the analysis)

        Document Type Indicators by priority:
        - Email: GREETINGS, SIGN-OFFS, direct communication, @ mentions
        - Wiki: Explanatory, informative, structured, impersonal
        - Memo: Brief, factual, internal, status-oriented
        - PowerPoint: Bullet points, presentation-oriented, visually structured          

        RETURN ONLY JSON:
        {{
          "documentType": "email|wiki|memo|powerpoint",
          "language": "de|en|etc",
          "confidence": 0.9|0.8|0.7|0.6|0.5|0.4|0.3|0.2|0.1
        }}
      `);

      const chain = prompt.pipe(model).pipe(new JsonOutputParser<{
        documentType: string;
        language: string;
        confidence: number;
      }>());
      const result = await chain.invoke({ text });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.log(`[detectDocumentType] Completed in ${duration}ms`);

      return {
        documentType: result.documentType as DocumentType,
        language: result.language,
        confidence: result.confidence
      };
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.error(`[detectDocumentType] Failed after ${duration}ms`, error);

      // Default to email if detection fails
      return {
        documentType: DocumentType.EMAIL,
        language: "en",
        confidence: 0
      };
    }
  }

  /**
   * Creates the email prompt template
   */
  private createEmailPrompt(instructions?: string): string {
    return dedent`
      Verwende pyramidale Strukturierung und bereite die E-Mail professionell auf.

      WICHTIG: Behalte die Originalsprache der E-Mail bei

      BETREFF-PRINZIP:
      **Wertschätzung der Leserzeit durch maximale Information im Betreff**
      - Der Betreff ist ein Mini-Executive-Summary der gesamten E-Mail
      - Empfänger sollen selektiv lesen und unwichtige Mails überspringen können
      - Länge ist zweitrangig - Informationsdichte ist prioritär

      BETREFF-FORMAT:
      [Hauptbotschaft] | [Details/Status] | [Erforderliche Aktionen/Deadlines] | [@Personen bei Bedarf]

      BETREFF-BEISPIELE:
      - \`Projekt Alpha verzögert sich | Ressourcenkonflikt mit Schulungen | Team-Meeting Di erforderlich | @Sarah Feedback bis Do\`
      - \`Status Update: Budget Q1 | System-Ausfall behoben | @Michael Freigabe nötig | @Lisa Input zu Metriken gewünscht\`
      - \`Onboarding Team X abgeschlossen | Tool-Zugriff bleibt offen | Meilenstein Y bis Ende Woche | Prozess Z pausiert | Koordination vorerst nicht nötig\`

      MAIL-STRUKTUR:
      **Pyramidaler Aufbau mit substantiellen Überschriften**

      ÜBERSCHRIFTEN-REGELN:
      - Jede Überschrift muss alleinstehend verständlich sein
      - Jede Überschrift ist eine Kernaussage oder Botschaft
      - Jede Überschrift bezeichnet einen gleichgewichtigen, abgeschlossenen Inhalt
      - Vermeide Prozess-Überschriften ("Bereits getestet", "Nächste Schritte")
      - Nutze Inhalts-Überschriften ("Login-Fehler auf beiden Servern","MVP Arbeit blockiert.")
      - Überschriften gleicher Ebene schließen sich gegenseitig aus (MECE-Prinzip)

      STRUKTUR-TEMPLATE:
      **Hauptbotschaft / Kernaussage / Überschrift**
        - Detailpunkt 1
        - Detailpunkt 2

      **Zweite Botschaft / Überschrift**
        - Details dazu

      **Weitere gleichgewichtige Botschaft / Überschrift**
        - Weitere Informationen

      STRUKTUR-BEISPIEL:
      Hallo Max,
      hier Update zu Projekt Fubar.

      **Zeitplan verzögert sich um 3 Tage**
        - Mitarbeiter krankheitsbedingt ausgefallen
        - Neue Deadline: 15. März

      **Terminvorschläge für Abstimmung**
        - Dienstag 14 Uhr
        - Mittwoch 10 Uhr

      Viele Grüße
      Anna

      ANALYSEPHASE:
      1. Erkenne alle wichtigen Informationen aus der Original-Mail
      2. KEINE essentiellen Inhalte verlieren bei der Umstrukturierung
      3. Auch "rohe" und unstrukturierte Inputs vollständig erfassen

      SPRACHSTIL:
      - Extrem kompakt, aber vollständig
      - Neutrale, sachliche Formulierung
      - Fette Überschriften, Bullet Points für Details
      - Keine Höflichkeitsfloskeln (außer Begrüßung/Grüße)

      REGELN:
      - Betreff: Informationsdichte über Kürze stellen
      - **INFORMATIONSGEHALT vollständig erhalten**
      - **PRIORITÄTSREGEL: Geschäftsauswirkung VOR technischen Details**
      - Pyramidenprinzip konsequent anwenden
      - @ für gezielte Personen-Adressierung nutzen

      AUSGABE:
      1. Informativer Betreff (so ausführlich wie nötig)
      2. Strukturierte E-Mail nach obiger Vorlage

      Text: {text}
      Document Type: email
      Source Application: {sourceApp}
      ${instructions ? `Additional Instructions: ${instructions}` : ''}

      RETURN ONLY JSON:
      {{
        "subject": "Informative subject line following the format",
        "headers": ["Header 1", "Header 2", "Header 3"],
        "fullDocument": "Complete formatted document with all headers and details",
        "documentType": "email",
        "language": "de|en|etc",
        "confidence": 0.9
      }}
    `;
  }

  /**
   * Creates the wiki prompt template
   */
  private createWikiPrompt(instructions?: string): string {
    return dedent`
      Verwende pyramidale Strukturierung und bereite den Wiki-Artikel professionell auf.

      WICHTIG: Behalte die Originalsprache des Textes bei

      TITEL-PRINZIP:
      **Präziser, informativer Titel für den Wiki-Artikel**
      - Der Titel sollte das Hauptthema klar benennen
      - Informativ und präzise, nicht reißerisch
      - Suchmaschinenoptimiert (wichtige Schlüsselwörter enthalten)

      WIKI-STRUKTUR:
      **Pyramidaler Aufbau mit substantiellen Überschriften**

      ÜBERSCHRIFTEN-REGELN:
      - Jede Überschrift muss alleinstehend verständlich sein
      - Hierarchische Struktur (H1, H2, H3)
      - Überschriften gleicher Ebene schließen sich gegenseitig aus (MECE-Prinzip)
      - Informative, nicht prozessorientierte Überschriften

      STRUKTUR-TEMPLATE:
      # Haupttitel

      Kurze Einführung/Zusammenfassung (1-2 Sätze)

      ## Wichtigster Aspekt / Kernaussage
        - Detailpunkt 1
        - Detailpunkt 2

      ## Zweiter wichtiger Aspekt
        - Details dazu

      ## Weitere relevante Informationen
        - Weitere Informationen

      ANALYSEPHASE:
      1. Erkenne alle wichtigen Informationen aus dem Originaltext
      2. KEINE essentiellen Inhalte verlieren bei der Umstrukturierung
      3. Auch "rohe" und unstrukturierte Inputs vollständig erfassen

      SPRACHSTIL:
      - Sachlich und neutral
      - Präzise und klar
      - Fachbegriffe wo angemessen
      - Keine persönliche Ansprache
      - Dritte Person bevorzugt

      REGELN:
      - **INFORMATIONSGEHALT vollständig erhalten**
      - **PRIORITÄTSREGEL: Wichtigste Informationen zuerst**
      - Pyramidenprinzip konsequent anwenden
      - Quellenangaben beibehalten falls vorhanden

      AUSGABE:
      1. Informativer Titel
      2. Strukturierter Wiki-Artikel nach obiger Vorlage

      Text: {text}
      Document Type: wiki
      Source Application: {sourceApp}
      ${instructions ? `Additional Instructions: ${instructions}` : ''}

      RETURN ONLY JSON:
      {{
        "subject": "Wiki article title",
        "headers": ["Header 1", "Header 2", "Header 3"],
        "fullDocument": "Complete formatted wiki article with all headers and details",
        "documentType": "wiki",
        "language": "de|en|etc",
        "confidence": 0.9
      }}
    `;
  }

  /**
   * Creates the memo prompt template
   */
  private createMemoPrompt(instructions?: string): string {
    return dedent`
      Verwende pyramidale Strukturierung und bereite das Memo professionell auf.

      WICHTIG: Behalte die Originalsprache des Textes bei

      BETREFF-PRINZIP:
      **Präziser, informativer Betreff für das Memo**
      - Der Betreff sollte das Hauptthema und den Zweck klar benennen
      - Kurz aber informativ

      MEMO-STRUKTUR:
      **Pyramidaler Aufbau mit substantiellen Überschriften**

      ÜBERSCHRIFTEN-REGELN:
      - Jede Überschrift muss alleinstehend verständlich sein
      - Jede Überschrift ist eine Kernaussage oder Botschaft
      - Überschriften gleicher Ebene schließen sich gegenseitig aus (MECE-Prinzip)

      STRUKTUR-TEMPLATE:
      MEMO

      AN: [Empfänger]
      VON: [Absender]
      DATUM: [Datum]
      BETREFF: [Präziser Betreff]

      **Hauptbotschaft / Kernaussage**
        - Detailpunkt 1
        - Detailpunkt 2

      **Zweite wichtige Information**
        - Details dazu

      **Weitere relevante Informationen**
        - Weitere Informationen

      ANALYSEPHASE:
      1. Erkenne alle wichtigen Informationen aus dem Originaltext
      2. KEINE essentiellen Inhalte verlieren bei der Umstrukturierung
      3. Auch "rohe" und unstrukturierte Inputs vollständig erfassen

      SPRACHSTIL:
      - Extrem kompakt, aber vollständig
      - Formell und sachlich
      - Fette Überschriften, Bullet Points für Details
      - Keine unnötigen Höflichkeitsfloskeln

      REGELN:
      - **INFORMATIONSGEHALT vollständig erhalten**
      - **PRIORITÄTSREGEL: Wichtigste Informationen zuerst**
      - Pyramidenprinzip konsequent anwenden

      AUSGABE:
      1. Informativer Betreff
      2. Strukturiertes Memo nach obiger Vorlage

      Text: {text}
      Document Type: memo
      Source Application: {sourceApp}
      ${instructions ? `Additional Instructions: ${instructions}` : ''}

      RETURN ONLY JSON:
      {{
        "subject": "Memo subject line",
        "headers": ["Header 1", "Header 2", "Header 3"],
        "fullDocument": "Complete formatted memo with all headers and details",
        "documentType": "memo",
        "language": "de|en|etc",
        "confidence": 0.9
      }}
    `;
  }

  /**
   * Creates the PowerPoint prompt template
   */
  private createPowerPointPrompt(instructions?: string): string {
    return dedent`
      Verwende pyramidale Strukturierung und bereite die PowerPoint-Präsentation professionell auf.

      WICHTIG: Behalte die Originalsprache des Textes bei

      TITEL-PRINZIP:
      **Präziser, informativer Titel für die Präsentation**
      - Der Titel sollte das Hauptthema klar benennen
      - Kurz, prägnant und aussagekräftig

      FOLIEN-STRUKTUR:
      **Pyramidaler Aufbau mit klaren Folien-Titeln**

      FOLIEN-REGELN:
      - Jeder Folien-Titel muss alleinstehend verständlich sein
      - Maximal 5-7 Bullet Points pro Folie
      - Jeder Bullet Point maximal 1-2 Zeilen
      - Folien gleicher Ebene schließen sich gegenseitig aus (MECE-Prinzip)

      STRUKTUR-TEMPLATE:
      # Präsentationstitel

      ## Folie 1: Hauptbotschaft / Kernaussage
        - Bullet Point 1
        - Bullet Point 2

      ## Folie 2: Zweite wichtige Information
        - Bullet Point 1
        - Bullet Point 2

      ## Folie 3: Weitere relevante Informationen
        - Bullet Point 1
        - Bullet Point 2

      ANALYSEPHASE:
      1. Erkenne alle wichtigen Informationen aus dem Originaltext
      2. KEINE essentiellen Inhalte verlieren bei der Umstrukturierung
      3. Auch "rohe" und unstrukturierte Inputs vollständig erfassen

      SPRACHSTIL:
      - Extrem kompakt und prägnant
      - Stichpunktartig
      - Keine vollständigen Sätze notwendig
      - Konsistente Formulierungen (z.B. alle mit Verb beginnen oder alle ohne)

      REGELN:
      - **INFORMATIONSGEHALT vollständig erhalten**
      - **PRIORITÄTSREGEL: Wichtigste Informationen zuerst**
      - Pyramidenprinzip konsequent anwenden
      - Visuelle Hierarchie beachten

      AUSGABE:
      1. Informativer Präsentationstitel
      2. Strukturierte Folien nach obiger Vorlage

      Text: {text}
      Document Type: powerpoint
      Source Application: {sourceApp}
      ${instructions ? `Additional Instructions: ${instructions}` : ''}

      RETURN ONLY JSON:
      {{
        "subject": "Presentation title",
        "headers": ["Slide 1 Title", "Slide 2 Title", "Slide 3 Title"],
        "fullDocument": "Complete formatted presentation with all slides and bullet points",
        "documentType": "powerpoint",
        "language": "de|en|etc",
        "confidence": 0.9
      }}
    `;
  }

  private createOneshotFoundationGenerator(model: ChatOpenAI | ChatAnthropic | BedrockChat | ChatOllama, instructions?: string): RunnableLambda<DocumentInput, OneshotResult> {
    return RunnableLambda.from<DocumentInput, OneshotResult>(async (input) => {
      console.log(`[oneshotFoundationGenerator] Starting with input`, { 
        textLength: input.text.length, 
        documentType: input.documentType,
        sourceApp: input.sourceApp
      });

      const startTime = new Date();

      try {
        // Determine document type if not specified or if auto
        let documentType = input.documentType;
        let detectedLanguage = "auto";

        if (!documentType || documentType === DocumentType.AUTO) {
          console.log(`[oneshotFoundationGenerator] Detecting document type`);
          const typeInfo = await this.detectDocumentType(model, input.text);
          documentType = typeInfo.documentType;
          detectedLanguage = typeInfo.language;
          console.log(`[oneshotFoundationGenerator] Detected document type: ${documentType}, language: ${detectedLanguage}`);
        }

        // Select the appropriate prompt based on document type
        let promptTemplate: string;
        switch (documentType) {
          case DocumentType.WIKI:
            promptTemplate = this.createWikiPrompt(instructions);
            break;
          case DocumentType.MEMO:
            promptTemplate = this.createMemoPrompt(instructions);
            break;
          case DocumentType.POWERPOINT:
            promptTemplate = this.createPowerPointPrompt(instructions);
            break;
          case DocumentType.EMAIL:
          default:
            promptTemplate = this.createEmailPrompt(instructions);
            break;
        }

        const oneshotPrompt = PromptTemplate.fromTemplate(promptTemplate);
        const chain = oneshotPrompt.pipe(model).pipe(new JsonOutputParser<{
          subject: string;
          headers: string[];
          fullDocument: string;
          documentType: string;
          language: string;
          confidence: number;
        }>());
        const rawResult = await chain.invoke({
          text: input.text,
          sourceApp: input.sourceApp || ''
        });

        // Convert the raw result to OneshotResult format
        const result: OneshotResult = {
          subject: rawResult.subject,
          headers: rawResult.headers,
          fullDocument: rawResult.fullDocument,
          documentType: documentType as DocumentType, // Use the determined document type
          language: rawResult.language,
          confidence: rawResult.confidence
        };

        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.log(`[oneshotFoundationGenerator] Completed in ${duration}ms with document type: ${result.documentType}`);

        return result;
      } catch (error) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.error(`[oneshotFoundationGenerator] Failed after ${duration}ms`, error);

        // Provide a fallback result
        return {
          subject: "Error processing document",
          headers: [],
          fullDocument: input.text,
          documentType: (input.documentType as DocumentType) || DocumentType.MEMO,
          language: "en",
          confidence: 0
        };
      }
    });
  }

  private createProcessingChain(model: ChatOpenAI | ChatAnthropic | BedrockChat | ChatOllama, instructions?: string): RunnableSequence {
    // Helper function to wrap a step with timing logs
    const withTiming = <I, O>(name: string, step: RunnableLambda<I, O>): RunnableLambda<I, O> => {
      return RunnableLambda.from<I, O>(async (input: I): Promise<O> => {
        const startTime = new Date();
        console.log(`[${name}] Starting at ${startTime.toISOString()}`);

        try {
          const result = await step.invoke(input);
          const endTime = new Date();
          const duration = endTime.getTime() - startTime.getTime();
          console.log(`[${name}] Completed at ${endTime.toISOString()}, duration: ${duration}ms`);
          return result;
        } catch (error) {
          const endTime = new Date();
          const duration = endTime.getTime() - startTime.getTime();
          console.error(`[${name}] Failed at ${endTime.toISOString()}, duration: ${duration}ms`, error);
          throw error;
        }
      });
    };

    // Phase 1: Oneshot Foundation Generator
    const oneshotGenerator = withTiming(
      'oneshotFoundationGenerator', 
      this.createOneshotFoundationGenerator(model, instructions)
    );

    // Phase 2: Parallel Specialist Agents
    // Create a wrapper to prepare input for the information completeness specialist
    const prepareInfoCompletenessInput = RunnableLambda.from<{
      input: DocumentInput, 
      oneshotResult: OneshotResult
    }, {
      oneshotResult: OneshotResult, 
      originalText: string
    }>(async (data) => {
      return {
        oneshotResult: data.oneshotResult,
        originalText: data.input.text
      };
    });

    // Create all specialist agents
    const subjectSpecialist = withTiming(
      'subjectLineSpecialist',
      this.createSubjectLineSpecialist(model)
    );

    const headerStructureSpecialist = withTiming(
      'headerStructureSpecialist',
      this.createHeaderStructureSpecialist(model)
    );

    const infoCompletenessSpecialist = withTiming(
      'informationCompletenessSpecialist',
      this.createInformationCompletenessSpecialist(model)
    );

    const styleLanguageSpecialist = withTiming(
      'styleLanguageSpecialist',
      this.createStyleLanguageSpecialist(model)
    );

    // Combine specialists into parallel execution
    const parallelSpecialists = RunnableParallel.from({
      subjectSpecialist: subjectSpecialist,
      headerStructureSpecialist: headerStructureSpecialist,
      informationCompletenessSpecialist: prepareInfoCompletenessInput.pipe(infoCompletenessSpecialist),
      styleLanguageSpecialist: styleLanguageSpecialist
    });

    // Phase 3: Integration Coordinator
    const integrationCoordinator = withTiming(
      'integrationCoordinator',
      this.createIntegrationCoordinator()
    );

    // Prepare input for the integration coordinator
    const prepareIntegrationInput = RunnableLambda.from<{
      input: DocumentInput,
      oneshotResult: OneshotResult,
      refinements: SpecialistRefinement
    }, {
      oneshotResult: OneshotResult,
      refinements: SpecialistRefinement,
      originalText: string
    }>(async (data) => {
      return {
        oneshotResult: data.oneshotResult,
        refinements: data.refinements,
        originalText: data.input.text
      };
    });

    // Create a final adapter to convert the integration result to the expected CompleteDocument format
    const finalAdapter = RunnableLambda.from<{
      input: DocumentInput,
      oneshotResult: OneshotResult,
      refinements: SpecialistRefinement,
      integrationResult: {
        finalDocument: string,
        subject: string,
        appliedImprovements: string[],
        qualityScore: number,
        intermediateResults: {
          oneshot: OneshotResult,
          refinements: SpecialistRefinement
        }
      }
    }, CompleteDocument>(async (data) => {
      // Create a structure based on the oneshot headers
      const structure: DocumentStructure = {
        headlines: data.oneshotResult.headers.map(header => ({
          title: header,
          details: [],
          priority: 'medium'
        }))
      };

      // Create format elements based on the subject
      const formatElements: FormatElements = {
        subject: data.integrationResult.subject
      };

      // Create a quality check
      const qualityCheck: QualityCheck = {
        informationLoss: [],
        accuracyIssues: [],
        missingElements: [],
        overallScore: data.integrationResult.qualityScore,
        passed: data.integrationResult.qualityScore > 0.7
      };

      // Extract document type and language from oneshot result
      const { documentType, language } = data.oneshotResult;

      // Return the complete document
      return {
        documentType,
        language,
        formatElements,
        finalDocument: data.integrationResult.finalDocument,
        subject: data.integrationResult.subject,
        appliedImprovements: data.integrationResult.appliedImprovements,
        qualityScore: data.integrationResult.qualityScore,
        structure,
        qualityCheck,
        intermediateSteps: {
          oneshot: data.oneshotResult,
          refinements: data.refinements
        }
      };
    });

    // Chain everything together
    return RunnableSequence.from<DocumentInput, CompleteDocument>([
      // Split the input to be used in multiple places
      RunnableLambda.from(async (input: DocumentInput) => ({ input })),

      // Phase 1: Generate the oneshot foundation
      RunnableParallel.from({
        input: RunnableLambda.from(async (data: { input: DocumentInput }) => data.input),
        oneshotResult: RunnableLambda.from(async (data: { input: DocumentInput }) => data.input).pipe(oneshotGenerator)
      }),

      // Phase 2: Run parallel specialists
      RunnableParallel.from({
        input: RunnableLambda.from(async (data: { input: DocumentInput, oneshotResult: OneshotResult }) => data.input),
        oneshotResult: RunnableLambda.from(async (data: { input: DocumentInput, oneshotResult: OneshotResult }) => data.oneshotResult),
        refinements: RunnableLambda.from(async (data: { input: DocumentInput, oneshotResult: OneshotResult }) => {
          return parallelSpecialists.invoke({
            input: data.input,
            oneshotResult: data.oneshotResult
          });
        })
      }),

      // Phase 3: Integration
      RunnableParallel.from({
        input: RunnableLambda.from(async (data: { input: DocumentInput, oneshotResult: OneshotResult, refinements: SpecialistRefinement }) => data.input),
        oneshotResult: RunnableLambda.from(async (data: { input: DocumentInput, oneshotResult: OneshotResult, refinements: SpecialistRefinement }) => data.oneshotResult),
        refinements: RunnableLambda.from(async (data: { input: DocumentInput, oneshotResult: OneshotResult, refinements: SpecialistRefinement }) => data.refinements),
        integrationResult: prepareIntegrationInput.pipe(integrationCoordinator)
      }),

      // Final adaptation to expected output format
      finalAdapter
    ]);
  }
}
