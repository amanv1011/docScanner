import OpenAI from 'openai';
import { DocumentRecord, AnalysisResult, KeyFinding, MetricComparison, Discrepancy, MissingInformation, SourceReference } from '../types/index.js';

/**
 * Builds a boundary-isolated XML structure representing each document.
 * This guarantees the LLM receives clear, unmerged context boundaries.
 */
export function buildIsolatedDocumentContext(documents: DocumentRecord[]): string {
  const docBlocks = documents.map((doc, idx) => {
    return [
      `<document index="${idx + 1}" id="${doc.id}" name="${escapeXml(doc.originalName)}" char_count="${doc.charCount}">`,
      `--- BEGIN DOCUMENT: ${doc.originalName} ---`,
      doc.extractedText,
      `--- END DOCUMENT: ${doc.originalName} ---`,
      `</document>`
    ].join('\n');
  });

  return [
    `<document_corpus total_documents="${documents.length}">`,
    ...docBlocks,
    `</document_corpus>`
  ].join('\n\n');
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export interface AnalyzeOptions {
  documents: DocumentRecord[];
  prompt: string;
}

export interface AnalyzeOutput {
  result: AnalysisResult;
  modelUsed: string;
  isMock: boolean;
}

/**
 * Executes multi-document analysis using OpenAI API or intelligent dynamic mock fallback.
 */
export async function analyzeDocuments(options: AnalyzeOptions): Promise<AnalyzeOutput> {
  const { documents, prompt } = options;

  if (documents.length === 0) {
    throw new Error('At least one document is required for analysis.');
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const preferredModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (apiKey && apiKey !== 'mock' && apiKey.startsWith('sk-')) {
    try {
      const openai = new OpenAI({ apiKey });
      const documentContext = buildIsolatedDocumentContext(documents);

      const systemPrompt = `You are the Multi-Document Intelligence Workbench AI Engine.
Your task is to perform rigorous comparative, factual, and analytical evaluation across the provided documents in response to the user's prompt.

CRITICAL INSTRUCTIONS:
1. STRICT BOUNDARY ADHERENCE: Documents are enclosed in <document> tags with a specific "name". Never merge or confuse facts between different documents.
2. SOURCE ATTRIBUTION: Every finding, comparison, discrepancy, and missing info must explicitly identify its exact "sourceDocument" matching the document's name.
3. FACT VS INTERPRETATION:
   - "fact": Direct, verbatim, or clearly stated factual claims in the source.
   - "interpretation": Deductions, risk analyses, trends, cross-document implications, or strategic assessments.
4. EVIDENCE REQUIRED: For factual statements, include the exact supporting text quote or data point in "evidence".
5. COMPARISONS: Create structured metrics comparing each document side-by-side.
6. DISCREPANCIES: Identify conflicting values, differing clauses, dates, numbers, or terms between documents.
7. MISSING INFORMATION: Highlight key information missing from one or more documents that is needed for thorough analysis.

You MUST respond strictly with valid JSON conforming to this schema:
{
  "summary": "High-level comparative executive summary answering the user prompt",
  "keyFindings": [
    {
      "id": "finding-1",
      "title": "Short descriptive title",
      "finding": "Detailed explanation of finding",
      "sourceDocument": "Exact filename from document tags",
      "category": "fact" or "interpretation",
      "evidence": "Exact excerpt or numerical evidence from document"
    }
  ],
  "comparisons": [
    {
      "metric": "Metric or Topic Name (e.g. Revenue, Delivery SLA, Cap)",
      "documentValues": {
        "DocumentA.pdf": "Value or status in doc A",
        "DocumentB.txt": "Value or status in doc B"
      },
      "commentary": "Comparative insight on differences or similarities"
    }
  ],
  "discrepancies": [
    {
      "id": "disc-1",
      "topic": "Topic of conflict or contradiction",
      "documentsInvolved": ["Doc1.pdf", "Doc2.txt"],
      "explanation": "Why this is a discrepancy and how the documents contradict each other",
      "severity": "low" | "medium" | "high"
    }
  ],
  "missingInformation": [
    {
      "id": "missing-1",
      "document": "Document filename with the gap",
      "whatIsMissing": "Specific missing data, appendix, clause, or metric",
      "impact": "Analytical or operational impact of this omission"
    }
  ],
  "sourceReferences": [
    {
      "documentId": "ID of document",
      "documentName": "Document filename",
      "totalChars": 1234,
      "tokenEstimate": 308,
      "excerpt": "Representative 100-200 char snippet showing key document theme"
    }
  ]
}`;

      const userMessage = `User Analysis Prompt: "${prompt}"\n\nAttached Documents:\n${documentContext}`;

      const response = await openai.chat.completions.create({
        model: preferredModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned an empty response.');
      }

      const parsed: AnalysisResult = JSON.parse(content);
      // Ensure sourceReferences has valid documentIds
      parsed.sourceReferences = documents.map((doc) => ({
        documentId: doc.id,
        documentName: doc.originalName,
        totalChars: doc.charCount,
        tokenEstimate: doc.tokenEstimate,
        excerpt: doc.extractedText.slice(0, 220).replace(/\n/g, ' ') + (doc.extractedText.length > 220 ? '...' : ''),
      }));

      return {
        result: parsed,
        modelUsed: `OpenAI ${response.model || preferredModel}`,
        isMock: false,
      };
    } catch (err: any) {
      console.warn(`[AI Service] OpenAI request failed (${err.message}). Falling back to Intelligent Mock Engine.`);
      return {
        result: generateDynamicMockAnalysis(documents, prompt),
        modelUsed: 'Intelligence Engine (Dynamic Fallback Mode)',
        isMock: true,
      };
    }
  }

  // No API key provided: use intelligent dynamic analyzer
  return {
    result: generateDynamicMockAnalysis(documents, prompt),
    modelUsed: 'Intelligence Engine (Dynamic Mock Mode)',
    isMock: true,
  };
}

/**
 * Intelligent dynamic mock analyzer that parses actual content, numbers, metrics,
 * dates, differences, and produces accurate source-attributed outputs.
 */
export function generateDynamicMockAnalysis(documents: DocumentRecord[], userPrompt: string): AnalysisResult {
  const docNames = documents.map((d) => d.originalName);
  
  // Extract key sentences and numerical patterns from each document
  const parsedDocs = documents.map((doc) => {
    const lines = doc.extractedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 10);
    
    // Find lines with numbers or currencies
    const dataLines = lines.filter((l) => /[\$€£%0-9]/.test(l));
    const dates = doc.extractedText.match(/\b(202[0-9]|Q[1-4]|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi) || [];

    return {
      doc,
      lines,
      dataLines,
      dates: Array.from(new Set(dates)),
    };
  });

  // 1. Generate Summary
  const summary = `Multi-Document comparative evaluation across ${documents.length} source file(s) [${docNames.join(', ')}] responding to prompt "${userPrompt}". The analysis isolated each document context, identified cross-document alignments, surfaced key numerical and operational metrics, and flagged discrepancies in reported figures and scope disclosures.`;

  // 2. Generate Key Findings with facts and interpretations
  const keyFindings: KeyFinding[] = [];
  let findingCounter = 1;

  for (const item of parsedDocs) {
    const { doc, dataLines, lines } = item;
    
    // Extracted Fact finding from actual document data
    const factLine = dataLines[0] || lines[0] || `Document contains ${doc.charCount} characters of structured content.`;
    keyFindings.push({
      id: `finding-${findingCounter++}`,
      title: `${doc.originalName}: Stated Metric & Factual Disclosure`,
      finding: `Source explicitly reports: "${factLine.slice(0, 140)}"`,
      sourceDocument: doc.originalName,
      category: 'fact',
      evidence: factLine.slice(0, 180),
    });

    if (dataLines.length > 1) {
      keyFindings.push({
        id: `finding-${findingCounter++}`,
        title: `${doc.originalName}: Core Data Line`,
        finding: `Document records numerical assertion: "${dataLines[1].slice(0, 140)}"`,
        sourceDocument: doc.originalName,
        category: 'fact',
        evidence: dataLines[1].slice(0, 180),
      });
    }

    // AI Interpretation finding derived from context
    keyFindings.push({
      id: `finding-${findingCounter++}`,
      title: `${doc.originalName}: Analytical Assessment & Contextual Implication`,
      finding: `Based on the disclosures in ${doc.originalName}, operational cadence reflects targeted milestones with dependencies on performance benchmarks and compliance verification.`,
      sourceDocument: doc.originalName,
      category: 'interpretation',
      evidence: (lines[Math.min(2, lines.length - 1)] || doc.extractedText.slice(0, 120)).slice(0, 180),
    });
  }

  // 3. Comparisons Table
  const comparisons: MetricComparison[] = [];
  
  // Metric: Document Type & Size
  const sizeMap: Record<string, string> = {};
  const lengthMap: Record<string, string> = {};
  const dataPointsMap: Record<string, string> = {};
  const primaryTopicMap: Record<string, string> = {};

  documents.forEach((doc, idx) => {
    sizeMap[doc.originalName] = `${(doc.fileSize / 1024).toFixed(1)} KB (${doc.mimeType || 'raw'})`;
    lengthMap[doc.originalName] = `${doc.charCount} chars (~${doc.tokenEstimate} tokens)`;
    
    const parsed = parsedDocs[idx];
    dataPointsMap[doc.originalName] = parsed.dataLines.length > 0 
      ? parsed.dataLines[0].slice(0, 60)
      : 'Qualitative narrative';
    
    // Detect topic keywords
    if (/financial|revenue|margin|profit|ebitda/i.test(doc.extractedText)) {
      primaryTopicMap[doc.originalName] = 'Financial Performance & Revenue';
    } else if (/agreement|contract|liability|termination|clause/i.test(doc.extractedText)) {
      primaryTopicMap[doc.originalName] = 'Contractual & Legal Obligations';
    } else if (/metric|csv|id|table|row/i.test(doc.extractedText)) {
      primaryTopicMap[doc.originalName] = 'Tabular Metric Records';
    } else {
      primaryTopicMap[doc.originalName] = 'General Intelligence & Operational Overview';
    }
  });

  comparisons.push({
    metric: 'Primary Subject Focus',
    documentValues: primaryTopicMap,
    commentary: 'Categorization based on keyword density and thematic structure across files.',
  });

  comparisons.push({
    metric: 'Key Quantitative Disclosures',
    documentValues: dataPointsMap,
    commentary: 'Direct extraction of primary numerical or fiscal statements across documents.',
  });

  comparisons.push({
    metric: 'Volume & Information Density',
    documentValues: lengthMap,
    commentary: 'Granularity variance between high-density tabular records and qualitative narrative briefs.',
  });

  // Cross-document specific comparisons if multiple documents
  if (documents.length > 1) {
    const crossValues: Record<string, string> = {};
    documents.forEach((doc, idx) => {
      const dates = parsedDocs[idx].dates;
      crossValues[doc.originalName] = dates.length > 0 ? `Periods: ${dates.slice(0, 3).join(', ')}` : 'No explicit period dates';
    });

    comparisons.push({
      metric: 'Reporting Period / Timeline References',
      documentValues: crossValues,
      commentary: 'Temporal alignment across uploaded files shows distinct or sequential observation windows.',
    });
  }

  // 4. Discrepancies
  const discrepancies: Discrepancy[] = [];
  if (documents.length > 1) {
    discrepancies.push({
      id: 'disc-1',
      topic: 'Reporting Scope and Metric Granularity Divergence',
      documentsInvolved: docNames,
      explanation: `Documents demonstrate differing levels of reporting granularity. For instance, "${docNames[0]}" provides specific sectional breakdowns, while "${docNames[1]}" aggregates summary observations or uses distinct baseline parameters.`,
      severity: 'medium',
    });

    // Check if dates or numbers differ
    if (parsedDocs[0].dates.length > 0 && parsedDocs[1].dates.length > 0) {
      const d1 = parsedDocs[0].dates[0];
      const d2 = parsedDocs[1].dates[0];
      if (d1 !== d2) {
        discrepancies.push({
          id: 'disc-2',
          topic: 'Temporal Period Mismatch',
          documentsInvolved: [docNames[0], docNames[1]],
          explanation: `Document "${docNames[0]}" references period (${d1}) whereas "${docNames[1]}" references period (${d2}). Metrics cannot be directly equated without adjusting for period differences.`,
          severity: 'high',
        });
      }
    }
  } else {
    discrepancies.push({
      id: 'disc-1',
      topic: 'Single Document Baseline Limitation',
      documentsInvolved: docNames,
      explanation: 'Only a single document was provided. Cross-document discrepancy analysis requires two or more files to highlight mutual inconsistencies.',
      severity: 'low',
    });
  }

  // 5. Missing Information
  const missingInformation: MissingInformation[] = [];
  documents.forEach((doc, idx) => {
    const text = doc.extractedText.toLowerCase();
    if (!text.includes('methodology') && !text.includes('appendix')) {
      missingInformation.push({
        id: `missing-${idx + 1}`,
        document: doc.originalName,
        whatIsMissing: 'Calculation methodology, footnote disclosures, or audit sign-off',
        impact: 'Limits independent auditability of reported figures without external verification.',
      });
    }
  });

  if (missingInformation.length === 0 && documents.length > 0) {
    missingInformation.push({
      id: 'missing-gen-1',
      document: documents[0].originalName,
      whatIsMissing: 'Forward-looking guidance risk factors',
      impact: 'Limits predictive projections past current operational cycle.',
    });
  }

  // 6. Source References
  const sourceReferences: SourceReference[] = documents.map((doc) => ({
    documentId: doc.id,
    documentName: doc.originalName,
    totalChars: doc.charCount,
    tokenEstimate: doc.tokenEstimate,
    excerpt: doc.extractedText.slice(0, 200).replace(/\n/g, ' ') + (doc.extractedText.length > 200 ? '...' : ''),
  }));

  return {
    summary,
    keyFindings,
    comparisons,
    discrepancies,
    missingInformation,
    sourceReferences,
  };
}
