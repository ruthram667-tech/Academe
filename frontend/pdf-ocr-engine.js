/**
 * Academe Hybrid PDF & OCR Engine
 * Provides dual-mode text extraction (Fast Digital + Handwritten/Scanned OCR via Tesseract.js)
 * and safe, non-destructive keyword matching with Levenshtein fuzzy tolerance for handwriting.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AcademeEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 1. Initialize PDF.js worker safely
  function initPdfJsWorker() {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        try {
          const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          // Workaround for cross-origin worker restriction in modern browsers
          const blob = new Blob([`importScripts('${workerUrl}');`], { type: 'application/javascript' });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        } catch (e) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
      }
    }
  }

  initPdfJsWorker();

  // 2. Ensure Tesseract.js is loaded dynamically if not present
  async function ensureTesseractLoaded() {
    if (typeof window !== 'undefined' && window.Tesseract) {
      return window.Tesseract;
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        resolve(window.Tesseract);
      };
      script.onerror = () => {
        // Fallback to secondary CDN
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js';
        fallbackScript.onload = () => resolve(window.Tesseract);
        fallbackScript.onerror = () => reject(new Error('Failed to load Tesseract OCR engine'));
        document.head.appendChild(fallbackScript);
      };
      document.head.appendChild(script);
    });
  }

  // 3. Helper: Convert File/Blob/Base64 to ArrayBuffer
  async function toArrayBuffer(input) {
    if (input instanceof ArrayBuffer) return input;
    if (input instanceof Uint8Array) return input.buffer;
    if (typeof Blob !== 'undefined' && input instanceof Blob) {
      return await input.arrayBuffer();
    }
    if (typeof input === 'string') {
      // Data URL or base64
      const base64Index = input.indexOf(';base64,');
      const b64 = base64Index !== -1 ? input.slice(base64Index + 8) : input;
      const binStr = atob(b64);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      return bytes.buffer;
    }
    throw new Error('Unsupported input format for PDF ArrayBuffer conversion.');
  }

  // 4. Fallback text parser when PDF.js or worker is unavailable
  function parsePdfTextFallback(arrayBuffer) {
    try {
      const bytes = new Uint8Array(arrayBuffer);
      let text = '';
      const decoder = new TextDecoder('latin1');
      const raw = decoder.decode(bytes);

      // Extract text inside parentheses in text blocks: (Hello World) Tj
      const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
      let match;
      while ((match = tjRegex.exec(raw)) !== null) {
        const decoded = match[1].replace(/\\([()\\])/g, '$1');
        if (decoded.length > 1 && !/[^\x20-\x7E\r\n\t]/.test(decoded)) {
          text += decoded + ' ';
        }
      }

      // Extract array text: [(Hello) 20 (World)] TJ
      const tjArrayRegex = /\[([^\]]+)\]\s*TJ/gi;
      while ((match = tjArrayRegex.exec(raw)) !== null) {
        const parts = match[1];
        const innerRegex = /\(([^)]+)\)/g;
        let innerMatch;
        while ((innerMatch = innerRegex.exec(parts)) !== null) {
          const dec = innerMatch[1].replace(/\\([()\\])/g, '$1');
          if (dec.length > 0) text += dec + ' ';
        }
      }

      const clean = text.replace(/\s+/g, ' ').trim();
      return clean.length > 20 ? clean : null;
    } catch {
      return null;
    }
  }

  // 5. Render a PDF page to Canvas (at 1.5x - 2.0x scale for high quality OCR)
  async function renderPageToCanvas(page, scale = 1.8) {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Fill white background (crucial for OCR accuracy on transparent backgrounds)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    return canvas;
  }

  // 6. Primary Hybrid PDF Extraction Function
  async function extractTextFromPDF(source, options = {}, progressCallback = null) {
    const opts = Object.assign({
      forceOCR: false,
      ocrLang: 'eng',
      maxPages: 8,
      scale: 1.8
    }, options);

    const reportProgress = (percent, stage, message) => {
      if (typeof progressCallback === 'function') {
        progressCallback({ percent, stage, message });
      }
    };

    reportProgress(5, 'loading', 'Loading document binary...');

    let arrayBuffer;
    try {
      arrayBuffer = await toArrayBuffer(source);
    } catch (err) {
      reportProgress(0, 'error', err.message);
      return { success: false, error: err.message };
    }

    // Ensure PDF.js is loaded
    initPdfJsWorker();

    let pdf = null;
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      try {
        const loadingTask = window.pdfjsLib.getDocument({
          data: arrayBuffer,
          useSystemFonts: true,
          isEvalSupported: false
        });
        pdf = await loadingTask.promise;
      } catch (pdfErr) {
        console.warn('PDF.js loading failed, attempting raw stream parser:', pdfErr);
      }
    }

    // If PDF.js failed completely, try fallback text parser
    if (!pdf) {
      reportProgress(50, 'fallback', 'Analyzing raw PDF data streams...');
      const fallbackText = parsePdfTextFallback(arrayBuffer);
      if (fallbackText) {
        reportProgress(100, 'done', 'Extracted text via fallback stream parser.');
        return {
          success: true,
          text: fallbackText,
          pages: [{ pageNumber: 1, text: fallbackText, isHandwritten: false }],
          pageCount: 1,
          isHandwritten: false,
          method: 'fallback_stream'
        };
      }
      return { success: false, error: 'Could not load PDF document or extract text.' };
    }

    const totalPages = Math.min(pdf.numPages, opts.maxPages);
    reportProgress(15, 'inspecting', `Document loaded (${totalPages} page${totalPages > 1 ? 's' : ''}). Testing digital text layer...`);

    // Step A: First inspect digital text layer if not forced to OCR
    let digitalPages = [];
    let totalDigitalChars = 0;

    if (!opts.forceOCR) {
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
        totalDigitalChars += pageText.length;
        digitalPages.push({ pageNumber: i, text: pageText, isHandwritten: false });
      }
    }

    // Check if we have sufficient digital text
    const isDigital = !opts.forceOCR && totalDigitalChars >= 40;

    if (isDigital) {
      reportProgress(100, 'done', `Extracted digital text successfully (${totalPages} pages, ${totalDigitalChars} chars).`);
      const fullText = digitalPages.map(p => p.text).filter(Boolean).join('\n\n');
      return {
        success: true,
        text: fullText,
        pages: digitalPages,
        pageCount: pdf.numPages,
        isHandwritten: false,
        method: 'digital'
      };
    }

    // Step B: If no digital text, or forceOCR is true -> Initiate OCR for Handwritten / Scanned Document
    reportProgress(25, 'ocr_prep', 'Scanned / Handwritten document detected. Initializing OCR engine...');

    let Tesseract;
    try {
      Tesseract = await ensureTesseractLoaded();
    } catch (ocrLoadErr) {
      console.warn('Tesseract failed to load:', ocrLoadErr);
      // If OCR failed to load, check if there was any minimal digital text
      if (totalDigitalChars > 0) {
        return {
          success: true,
          text: digitalPages.map(p => p.text).join('\n\n'),
          pages: digitalPages,
          pageCount: pdf.numPages,
          isHandwritten: true,
          method: 'digital_minimal',
          warning: 'OCR engine unavailable; showing minimal digital layer.'
        };
      }
      return {
        success: false,
        error: 'Document contains scanned images or handwriting, but OCR engine could not be initialized.'
      };
    }

    const ocrPages = [];
    let fullOcrText = '';

    for (let i = 1; i <= totalPages; i++) {
      const pageProgressBase = 25 + Math.round(((i - 1) / totalPages) * 70);
      reportProgress(pageProgressBase, 'ocr_rendering', `Rendering page ${i} of ${totalPages} for handwriting OCR...`);

      const page = await pdf.getPage(i);
      const canvas = await renderPageToCanvas(page, opts.scale);

      reportProgress(pageProgressBase + 5, 'ocr_recognizing', `Recognizing handwriting on page ${i} of ${totalPages}...`);

      try {
        const ocrResult = await Tesseract.recognize(canvas, opts.ocrLang || 'eng', {
          logger: m => {
            if (m.status === 'recognizing text' && m.progress) {
              const currentPercent = Math.min(95, pageProgressBase + Math.round(m.progress * (70 / totalPages)));
              reportProgress(currentPercent, 'ocr_progress', `Page ${i}/${totalPages}: Recognizing text (${Math.round(m.progress * 100)}%)...`);
            }
          }
        });

        const pageText = (ocrResult.data && ocrResult.data.text ? ocrResult.data.text : '').trim();
        ocrPages.push({
          pageNumber: i,
          text: pageText,
          isHandwritten: true,
          confidence: ocrResult.data ? ocrResult.data.confidence : 0,
          canvasDataUrl: canvas.toDataURL('image/jpeg', 0.8) // thumbnail for preview
        });

        fullOcrText += (fullOcrText ? '\n\n' : '') + pageText;
      } catch (pageOcrErr) {
        console.error(`OCR error on page ${i}:`, pageOcrErr);
        ocrPages.push({ pageNumber: i, text: '[Could not recognize text on this page]', isHandwritten: true });
      }
    }

    reportProgress(100, 'done', `Handwriting recognition complete (${totalPages} pages processed).`);

    return {
      success: true,
      text: fullOcrText || '[No handwriting could be identified on scanned pages]',
      pages: ocrPages,
      pageCount: pdf.numPages,
      isHandwritten: true,
      method: 'ocr'
    };
  }

  // 7. Levenshtein Distance for Fuzzy Handwriting Matching
  function levenshtein(s1, s2) {
    const a = s1.toLowerCase();
    const b = s2.toLowerCase();
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const v0 = new Array(b.length + 1);
    const v1 = new Array(b.length + 1);

    for (let i = 0; i <= b.length; i++) v0[i] = i;

    for (let i = 0; i < a.length; i++) {
      v1[0] = i + 1;
      for (let j = 0; j < b.length; j++) {
        const cost = a[i] === b[j] ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
    }

    return v1[b.length];
  }

  // Helper: Escape Regex Characters
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Helper: Escape HTML Characters
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper: Smart Regex Builder with Word Boundaries
  function buildKeywordRegex(kw) {
    const trimmed = kw.trim();
    const escaped = escapeRegex(trimmed);
    const startBound = /^\w/.test(trimmed) ? '\\b' : '';
    const endBound = /\w$/.test(trimmed) ? '\\b' : '';
    return new RegExp(`${startBound}${escaped}${endBound}`, 'gi');
  }

  // 8. Safe Interval-Based Keyword Matching & Highlighting Engine
  function matchAndHighlightKeywords(plainText, keywordsInput, options = {}) {
    const opts = Object.assign({
      enableFuzzy: true,
      suggestedMaxScore: 100,
      fuzzyThresholdMaxDist: 1
    }, options);

    if (!plainText) {
      return {
        highlightedHtml: '<span style="color:#94a3b8; font-style:italic;">No text content available.</span>',
        totalMatches: 0,
        exactMatches: 0,
        fuzzyMatches: 0,
        chips: [],
        coverage: 0,
        suggestedScore: 0
      };
    }

    // Parse keywords input (can be string or array)
    let keywordsList = [];
    if (Array.isArray(keywordsInput)) {
      keywordsList = keywordsInput;
    } else if (typeof keywordsInput === 'string') {
      keywordsList = keywordsInput.split(/[,;\n]+/).map(k => k.trim()).filter(Boolean);
    }

    // Deduplicate case-insensitively while preserving original casing
    const seen = new Set();
    const uniqueKeywords = [];
    keywordsList.forEach(k => {
      const lower = k.toLowerCase().trim();
      if (lower && !seen.has(lower)) {
        seen.add(lower);
        uniqueKeywords.push(k.trim());
      }
    });

    if (uniqueKeywords.length === 0) {
      return {
        highlightedHtml: escapeHtml(plainText).replace(/\n/g, '<br>'),
        totalMatches: 0,
        exactMatches: 0,
        fuzzyMatches: 0,
        chips: [],
        coverage: 0,
        suggestedScore: 0
      };
    }

    // Find all match intervals on the RAW plain text: [start, end, keyword, matchedText, isFuzzy]
    const intervals = [];
    const keywordStats = {};

    uniqueKeywords.forEach(kw => {
      keywordStats[kw.toLowerCase()] = {
        keyword: kw,
        exactCount: 0,
        fuzzyCount: 0,
        totalCount: 0
      };

      // 1. Exact matching with word boundary regex
      const regex = buildKeywordRegex(kw);
      let match;
      while ((match = regex.exec(plainText)) !== null) {
        intervals.push({
          start: match.index,
          end: match.index + match[0].length,
          keyword: kw,
          matchedText: match[0],
          isFuzzy: false
        });
        keywordStats[kw.toLowerCase()].exactCount++;
      }
    });

    // 2. Fuzzy Matching for Handwritten / OCR text variations
    if (opts.enableFuzzy) {
      // Tokenize text into words with position indices
      const wordRegex = /\b[A-Za-z0-9_-]{3,}\b/g;
      let wordMatch;
      while ((wordMatch = wordRegex.exec(plainText)) !== null) {
        const token = wordMatch[0];
        const tokenStart = wordMatch.index;
        const tokenEnd = tokenStart + token.length;

        // Check if this token is already part of an exact match interval
        const isCovered = intervals.some(inv => 
          (tokenStart >= inv.start && tokenStart < inv.end) || 
          (tokenEnd > inv.start && tokenEnd <= inv.end)
        );
        if (isCovered) continue;

        // Compare with each target keyword (for keywords >= 4 characters)
        uniqueKeywords.forEach(kw => {
          if (kw.length < 4) return;
          // Only attempt fuzzy if keyword has single word structure or matches token length closely
          if (Math.abs(token.length - kw.length) <= 1) {
            const dist = levenshtein(token, kw);
            // Allow distance 1 for length 4-7, distance 2 for length 8+
            const maxAllowed = kw.length >= 8 ? 2 : 1;
            if (dist > 0 && dist <= maxAllowed) {
              intervals.push({
                start: tokenStart,
                end: tokenEnd,
                keyword: kw,
                matchedText: token,
                isFuzzy: true,
                targetKeyword: kw
              });
              keywordStats[kw.toLowerCase()].fuzzyCount++;
            }
          }
        });
      }
    }

    // 3. Sort intervals by starting index ascending, and longer spans first for ties
    intervals.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    // 4. Merge/filter overlapping intervals (prevent overlapping HTML tag corruption)
    const filteredIntervals = [];
    let lastEnd = 0;
    for (const inv of intervals) {
      if (inv.start >= lastEnd) {
        filteredIntervals.push(inv);
        lastEnd = inv.end;
      }
    }

    // 5. Construct Safe Highlighted HTML by slicing raw plain text
    let html = '';
    let cursor = 0;

    filteredIntervals.forEach(inv => {
      // Append unhighlighted text before the match (escaped)
      if (inv.start > cursor) {
        html += escapeHtml(plainText.slice(cursor, inv.start));
      }

      // Wrap the matched text in a rich, styled tag
      const markClass = inv.isFuzzy ? 'kw-highlight kw-fuzzy' : 'kw-highlight kw-exact';
      const bgColor = inv.isFuzzy ? '#fef08a' : '#fde047'; // Amber for fuzzy, bright yellow for exact
      const borderColor = inv.isFuzzy ? '#eab308' : '#ca8a04';
      const tooltip = inv.isFuzzy 
        ? `Handwriting OCR variation for: "${escapeHtml(inv.targetKeyword || inv.keyword)}"` 
        : `Keyword: "${escapeHtml(inv.keyword)}"`;

      html += `<mark class="${markClass}" data-kw="${escapeHtml(inv.keyword.toLowerCase())}" title="${tooltip}" style="background-color: ${bgColor}; color: #1e293b; font-weight: 700; padding: 1px 4px; border-radius: 4px; border: 1px solid ${borderColor}; margin: 0 1px;">${escapeHtml(inv.matchedText)}</mark>`;

      cursor = inv.end;
    });

    // Append remainder of text
    if (cursor < plainText.length) {
      html += escapeHtml(plainText.slice(cursor));
    }

    // Preserve newlines cleanly in HTML display
    html = html.replace(/\n/g, '<br>');

    // 6. Compile Chip Statistics
    let totalMatches = 0;
    let exactMatches = 0;
    let fuzzyMatches = 0;
    let matchedKeywordsCount = 0;

    const chips = uniqueKeywords.map(kw => {
      const stats = keywordStats[kw.toLowerCase()];
      const total = stats.exactCount + stats.fuzzyCount;
      totalMatches += total;
      exactMatches += stats.exactCount;
      fuzzyMatches += stats.fuzzyCount;
      if (total > 0) matchedKeywordsCount++;

      return {
        keyword: kw,
        exactCount: stats.exactCount,
        fuzzyCount: stats.fuzzyCount,
        totalCount: total,
        isMatched: total > 0
      };
    });

    const coverage = uniqueKeywords.length > 0 ? (matchedKeywordsCount / uniqueKeywords.length) : 0;
    const maxScore = Number(opts.suggestedMaxScore) || 100;
    
    // Suggested score based on coverage and match density (proportional to total marks)
    let suggestedScore = Math.round(coverage * maxScore);
    if (suggestedScore > maxScore) suggestedScore = maxScore;

    return {
      highlightedHtml: html,
      totalMatches,
      exactMatches,
      fuzzyMatches,
      matchedKeywordsCount,
      totalKeywordsCount: uniqueKeywords.length,
      chips,
      coverage: Math.round(coverage * 100),
      suggestedScore
    };
  }

  // Export public API
  return {
    extractTextFromPDF,
    matchAndHighlightKeywords,
    renderPageToCanvas,
    levenshtein,
    escapeHtml,
    escapeRegex
  };
});
