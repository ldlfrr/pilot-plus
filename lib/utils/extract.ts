// Text extraction utilities for PDF and DOCX files

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  const mime = fileType.toLowerCase()

  if (mime === 'application/pdf' || mime.endsWith('.pdf')) {
    return extractFromPdf(buffer)
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword' ||
    mime.endsWith('.docx') ||
    mime.endsWith('.doc')
  ) {
    return extractFromDocx(buffer)
  }

  if (mime.startsWith('text/')) {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: ${fileType}`)
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with edge runtime
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return cleanExtractedText(data.text)
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return cleanExtractedText(result.value)
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim
    .trim()
}

export function truncateText(text: string, maxChars = 80_000): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n\n[... Document tronqué pour l\'analyse IA ...]'
}
