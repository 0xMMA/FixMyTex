import { Injectable } from '@angular/core';
import { LangChainService } from './langchain.service';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";
import {JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { LLMProvider } from '../models/langchain-config';
import dedent from "dedent";

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
 * Core message structure
 */
export interface CoreMessage {
  message: string;
  businessImpact: 'high' | 'medium' | 'low';
  type: 'outcome' | 'action' | 'status' | 'decision';
  confidence: number;
}

/**
 * Document analysis structure
 */
export interface DocumentAnalysis {
  documentType: DocumentType;
  language: string;
  coreMessages: CoreMessage[];
  people: string[];
  deadlines: string[];
  actions: string[];
  details: string[];
  confidence: number;
  error?: string;
  raw?: string;
}

/**
 * Information extraction (separate from core messages)
 */
export interface InformationExtraction {
  people: string[];
  deadlines: string[];
  actions: string[];
  details: string[];
  technicalDetails: string[];
  error?: string;
  raw?: string;
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
 * Complete result
 */
export interface PyramidalAgentResult {
  documentType: DocumentType;
  formatElements: FormatElements;
  finalDocument: string;
  coreMessages: CoreMessage[];
  structure: DocumentStructure;
  qualityCheck: QualityCheck;
  intermediateSteps?: {
    analysis?: DocumentAnalysis;
    information?: InformationExtraction;
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

interface DocumentWithAnalysis extends DocumentInput {
  analysis: DocumentAnalysis;
}

interface DocumentWithCoreMessages extends DocumentWithAnalysis {
  coreMessages: CoreMessage[];
}

interface DocumentWithInformation extends DocumentWithCoreMessages {
  information: InformationExtraction;
}

interface DocumentWithStructure extends DocumentWithInformation {
  structure: DocumentStructure;
}

interface DocumentWithFormat extends DocumentWithStructure {
  formatElements: FormatElements;
}

interface CompleteDocument extends DocumentWithFormat {
  finalDocument: string;
  qualityCheck: QualityCheck;
}

@Injectable({
  providedIn: 'root'
})
export class PyramidalAgentService {
  constructor(private langChainService: LangChainService) {}

  async processDocument(text: string, documentType: DocumentType = DocumentType.AUTO, sourceApp?: string, instructions?: string): Promise<PyramidalAgentResult> {
    try {
      console.log('Processing document with pyramidal agent flow', { text, documentType, sourceApp, instructions });

      const model = await this.getModel();
      const processingChain = this.createProcessingChain(model, instructions);

      const result = await processingChain.invoke({
        text,
        documentType: documentType === DocumentType.AUTO ? undefined : documentType,
        sourceApp,
        instructions
      });

      return {
        documentType: result.analysis.documentType,
        formatElements: result.formatElements,
        finalDocument: result.finalDocument,
        coreMessages: result.coreMessages,
        structure: result.structure,
        qualityCheck: result.qualityCheck,
        intermediateSteps: {
          analysis: result.analysis,
          information: result.information
        }
      };
    } catch (error) {
      console.error('Error processing document with pyramidal agent flow', error);
      throw error;
    }
  }

  private async getModel(): Promise<ChatOpenAI | ChatAnthropic> {
    const config = this.langChainService.getConfig();
    if (!config.apiKey) {
      throw new Error('API key is not set');
    }

    if (config.provider === LLMProvider.OPENAI) {
      return new ChatOpenAI({
        model: config.model,
        openAIApiKey: config.apiKey,
        temperature: 0.1,
      });
    } else if (config.provider === LLMProvider.ANTHROPIC) {
      return new ChatAnthropic({
        model: config.model,
        anthropicApiKey: config.apiKey,
        temperature: 0.1,
      });
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  private createProcessingChain(model: ChatOpenAI | ChatAnthropic, instructions?: string): RunnableSequence {

    // Step 1: Document Type Detection & Basic Analysis
    const analyzeDocument = RunnableLambda.from<DocumentInput, DocumentWithAnalysis>(async (input) => {
      // Check if the document type is specified or 'auto'
      const isAutoDetection = !input.documentType || input.documentType === 'auto';

      if (isAutoDetection) {
        // Use auto-detection prompt when the document type is not specified or is 'auto'
        const autoDetectionPrompt = PromptTemplate.fromTemplate(dedent`
          Analyze this text and determine the document type and base language.

          Text: {text}
          Source Application: {sourceApp}
          ${instructions ? `Additional Instructions: ${instructions}` : ''}

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
            confidence": 0.9|0.8|0.7|0.6|0.5|0.4|0.3|0.2|0.1
          }}
        `);

        const chain = autoDetectionPrompt.pipe(model).pipe(new JsonOutputParser());
        const result = await chain.invoke({
          text: input.text,
          sourceApp: input.sourceApp || ''
        });

        try {
          const analysisData: { documentType: string; language: string; confidence: number } = result;
          const analysis: DocumentAnalysis = {
            documentType: analysisData.documentType as DocumentType,
            language: analysisData.language,
            coreMessages: [], // Will be filled in the next step
            people: [],
            deadlines: [],
            actions: [],
            details: [],
            confidence: analysisData.confidence
          };
          return { ...input, analysis };
        } catch (e) {
          return {
            ...input,
            analysis: {
              documentType: DocumentType.MEMO,
              language: 'de',
              coreMessages: [],
              people: [],
              deadlines: [],
              actions: [],
              details: [],
              confidence: 0,
              error: "Parse failed",
              raw: result
            }
          };
        }
      } else {
        // Use specified type prompt when the document type is provided
        const specifiedTypePrompt = PromptTemplate.fromTemplate(dedent`
          Analyze this text and determine the base language.

          Text: {text}
          Document Type: {documentType}
          Source Application: {sourceApp}
          ${instructions ? `Additional Instructions: ${instructions}` : ''}

          Determine:
          1. language: "de", "en", etc.
          2. confidence: 0-1 (confidence in the analysis)

          RETURN ONLY JSON:
          {{
            "language": "de|en|etc",
            "confidence": 0.9|0.8|0.7|0.6|0.5|0.4|0.3|0.2|0.1
          }}
        `);

        const chain = specifiedTypePrompt.pipe(model).pipe(new JsonOutputParser());
        const result = await chain.invoke({
          text: input.text,
          documentType: input.documentType,
          sourceApp: input.sourceApp || ''
        });

        try {
          const analysisData: { language: string; confidence: number } = result;
          const analysis: DocumentAnalysis = {
            documentType: input.documentType as DocumentType, // Use the provided document type
            language: analysisData.language,
            coreMessages: [], // Will be filled in the next step
            people: [],
            deadlines: [],
            actions: [],
            details: [],
            confidence: analysisData.confidence || 0.9
          };
          return { ...input, analysis };
        } catch (e) {
          return {
            ...input,
            analysis: {
              documentType: input.documentType as DocumentType, // Use the provided document type
              language: 'de',
              coreMessages: [],
              people: [],
              deadlines: [],
              actions: [],
              details: [],
              confidence: 0,
              error: "Parse failed",
              raw: result
            }
          };
        }
      }
    });

    // Step 2: Core Message Extraction (DEDICATED STEP)
    const extractCoreMessages = RunnableLambda.from<DocumentWithAnalysis, DocumentWithCoreMessages>(async (input) => {
      const prompt = PromptTemplate.fromTemplate(dedent`
        Extract the CORE MESSAGES from this text. Focus EXCLUSIVELY on the most important statements.

        Text: {text}
        Document Type: {documentType}
        Language: {language}
        ${instructions ? `Additional Instructions: ${instructions}` : ''}

        CORE MESSAGE RULES:
        - Each core message is a standalone, understandable statement
        - Focus on BUSINESS IMPACT, not on processes
        - Outcome- or action-oriented
        - No technical details (those come later)
        - Maximum 3-5 core messages per text

        EXAMPLES OF GOOD CORE MESSAGES:
        ✅ "Project Alpha delayed by 3 days"
        ✅ "Q1 budget exceeded by 15%"
        ✅ "Sarah takes over team leadership next week"

        EXAMPLES OF BAD CORE MESSAGES:
        ❌ "Next steps discussed"
        ❌ "Meeting took place"
        ❌ "Server was restarted"

        RETURN ONLY JSON:
        {{
          "coreMessages": [
            {{
              "message": "Clear, standalone core statement",
              "businessImpact": "high|medium|low",
              "type": "outcome|action|status|decision",
              "confidence": 0.9|0.8|0.7|0.6|0.5|0.4|0.3|0.2|0.1
            }}
          ]
        }}
      `);

      const chain = prompt.pipe(model).pipe(new JsonOutputParser());
      const result = await chain.invoke({
        text: input.text,
        documentType: input.analysis.documentType,
        language: input.analysis.language
      });

      try {
        const data: { coreMessages: CoreMessage[] } = result;
        const coreMessages: CoreMessage[] = data.coreMessages || [];
        return { ...input, coreMessages };
      } catch (e) {
        return { ...input, coreMessages: [] };
      }
    });

    // Step 3: Information Extraction (People, Deadlines, Actions, Details)
    const extractInformation = RunnableLambda.from<DocumentWithCoreMessages, DocumentWithInformation>(async (input) => {
      const prompt = PromptTemplate.fromTemplate(dedent`
        Extract DETAIL INFORMATION from this text (NOT the core messages).

        Text: {text}
        Core Messages: {coreMessages}
        Language: {language}
        ${instructions ? `Additional Instructions: ${instructions}` : ''}

        Extract:
        - people: All mentioned persons (names, @mentions, roles)
        - deadlines: Dates, deadlines, time constraints
        - actions: Concrete actions/todos (not the core messages!)
        - details: Important details that support the core messages
        - technicalDetails: Technical information, system details

        RETURN ONLY JSON:
        {{
          "people": ["Person 1", "Person 2"],
          "deadlines": ["Friday", "End of Q1"],
          "actions": ["Organize meeting", "Approve budget"],
          "details": ["Supportive details"],
          "technicalDetails": ["Server X", "System Y"]
        }}
      `);

      const chain = prompt.pipe(model).pipe(new JsonOutputParser());
      const result = await chain.invoke({
        text: input.text,
        coreMessages: JSON.stringify(input.coreMessages),
        language: input.analysis.language
      });

      try {
        const information: InformationExtraction = result;
        return { ...input, information };
      } catch (e) {
        return {
          ...input,
          information: {
            people: [],
            deadlines: [],
            actions: [],
            details: [],
            technicalDetails: [],
            error: "Parse failed",
            raw: result
          }
        };
      }
    });

    // Step 4: Structure Generation (MECE + Pyramidal)
    const generateStructure = RunnableLambda.from<DocumentWithInformation, DocumentWithStructure>(async (input) => {
      const prompt = PromptTemplate.fromTemplate(dedent`
        Create pyramidal MECE structure based on the core messages.

        Core Messages: {coreMessages}
        Detail Information: {information}
        Document Type: {documentType}
        Language: {language}
        ${instructions ? `Additional Instructions: ${instructions}` : ''}

        MECE RULES:
        - Each heading = one core message or logical grouping
        - Headlines are mutually exclusive
        - Headlines are standalone understandable
        - NO process headings ("Next Steps")
        - Business impact before technical details

        RETURN ONLY JSON:
        {{
          "headlines": [
            {{
              "title": "Core message as substantial heading",
              "details": ["Detail 1", "Detail 2"],
              "priority": "high|medium|low"
            }}
          ]
        }}
      `);

      const chain = prompt.pipe(model).pipe(new JsonOutputParser());
      const result = await chain.invoke({
        coreMessages: JSON.stringify(input.coreMessages),
        information: JSON.stringify(input.information),
        documentType: input.analysis.documentType,
        language: input.analysis.language
      });

      try {
        const structure: DocumentStructure = result;
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

    // Step 5: Format-Specific Elements (BRANCHING)
    const generateFormatElements = RunnableLambda.from<DocumentWithStructure, DocumentWithFormat>(async (input) => {
      const documentType = input.analysis.documentType;

      if (documentType === DocumentType.EMAIL) {
        // Generate email subject
        const prompt = PromptTemplate.fromTemplate(dedent`
          Create informative email subject line following the format:
          Main Message | Details/Status | Actions/Deadlines | @People who we need action or active attention from

          Core Messages: {coreMessages}
          Information: {information}
          Language: {language}
          ${instructions ? `Additional Instructions: ${instructions}` : ''}

          EXAMPLES:
          - "Project Alpha delayed | Resource conflict | Team meeting Tue | @Sarah feedback by Thu"
          - "Q1 budget exceeded | System failure cause | @Michael approval needed"
          
          RETURN ONLY THE SUBJECT LINE:
        `);

        const chain = prompt.pipe(model).pipe(new StringOutputParser());
        const subject = await chain.invoke({
          coreMessages: JSON.stringify(input.coreMessages),
          information: JSON.stringify(input.information),
          language: input.analysis.language
        });

        return {
          ...input,
          formatElements: { subject: subject.trim() }
        };
      } else {
        // For wiki, memo, powerpoint - generate title and summary
        const prompt = PromptTemplate.fromTemplate(dedent`
          Create title and summary for {documentType}.

          Core Messages: {coreMessages}
          Language: {language}
          ${instructions ? `Additional Instructions: ${instructions}` : ''}

          RETURN ONLY JSON:
          {{
            "title": "Concise title",
            "summary": "Brief summary"
          }}
        `);

        const chain = prompt.pipe(model).pipe(new JsonOutputParser());
        const result = await chain.invoke({
          documentType,
          coreMessages: JSON.stringify(input.coreMessages),
          language: input.analysis.language
        });

        try {
          const elements: { title: string; summary: string } = result;
          return {
            ...input,
            formatElements: {
              title: elements.title,
              summary: elements.summary
            }
          };
        } catch (e) {
          return {
            ...input,
            formatElements: {
              title: "Unknown Title",
              summary: "Summary not available"
            }
          };
        }
      }
    });

    // Step 6: Final Formatting
    const formatDocument = RunnableLambda.from<DocumentWithFormat, CompleteDocument>(async (input) => {
      const documentType = input.analysis.documentType;

      const prompt = PromptTemplate.fromTemplate(dedent`
        Format the final ${documentType} document.

        Document Type: {documentType}
        Format Elements: {formatElements}
        Structure: {structure}
        Original Text Context: {text}
        Language: {language}
        ${instructions ? `Additional Instructions: ${instructions}` : ''}

        FORMAT for ${documentType}:
        ${documentType === 'email' ? `
        - Brief greeting
        - **Bold headings** with bullet points
        - Compact but complete
        - Professional closing
        ` : documentType === 'wiki' ? `
        - Title as H1
        - Structured sections
        - Informative and objective
        - Bullet points for details
        ` : `
        - Title/heading
        - Structured sections
        - Bullet points
        - Concise and clear
        `}

        Complete formatted ${documentType}:
      `);

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const finalDocument = await chain.invoke({
        documentType,
        formatElements: JSON.stringify(input.formatElements),
        structure: JSON.stringify(input.structure),
        text: input.text,
        language: input.analysis.language
      });

      // Mock quality check for now - this could be another LLM call
      const qualityCheck: QualityCheck = {
        informationLoss: [],
        accuracyIssues: [],
        missingElements: [],
        overallScore: 0.85,
        passed: true
      };

      return {
        ...input,
        finalDocument: finalDocument.trim(),
        qualityCheck
      };
    });

    // Chain everything together
    return RunnableSequence.from<DocumentInput, CompleteDocument>([
      analyzeDocument,
      extractCoreMessages,
      extractInformation,
      generateStructure,
      generateFormatElements,
      formatDocument
    ]);
  }
}
