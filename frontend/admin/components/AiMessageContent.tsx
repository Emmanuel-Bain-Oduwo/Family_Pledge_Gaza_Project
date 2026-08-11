'use client';

import { Fragment, type ReactNode } from 'react';

interface AiMessageContentProps {
  content: unknown;
  className?: string;
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function structuredToText(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const rendered = structuredToText(item, depth + 1).trim();
        return rendered ? `- ${rendered.replace(/\n/g, '\n  ')}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const preferred of ['text', 'answer', 'content', 'body', 'message', 'generated_text']) {
      const candidate = record[preferred];
      if (typeof candidate === 'string' && candidate.trim()) return candidate;
    }

    return Object.entries(record)
      .filter(([, nested]) => nested !== null && nested !== undefined && nested !== '')
      .map(([key, nested]) => {
        const rendered = structuredToText(nested, depth + 1).trim();
        if (!rendered) return '';
        if (typeof nested === 'object') {
          const heading = depth === 0 ? '##' : '###';
          return `${heading} ${titleCase(key)}\n${rendered}`;
        }
        return `**${titleCase(key)}:** ${rendered}`;
      })
      .filter(Boolean)
      .join('\n\n');
  }

  return String(value);
}

function normalizeContent(content: unknown): string {
  const normalized = structuredToText(content).trim();
  if (!normalized || normalized === '[object Object]') {
    return 'This response could not be displayed clearly. Please retry the action.';
  }
  return normalized;
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')));
}

function renderInline(text: string): ReactNode[] {
  const tokenPattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  const parts = text.split(tokenPattern).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-gray-950">{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.92em] text-gray-800">{part.slice(1, -1)}</code>;
    }

    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) {
      return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">{link[1]}</a>;
    }

    return <Fragment key={index}>{part.replace(/^#{1,6}\s*/, '')}</Fragment>;
  });
}

export default function AiMessageContent({ content, className = '' }: AiMessageContentProps) {
  const text = normalizeContent(content);
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const output: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^(```|~~~)/.test(line)) {
      const fence = line.slice(0, 3);
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(fence)) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      output.push(
        <pre key={`code-${index}`} className="my-3 overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs leading-6 text-gray-100">
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (index + 1 < lines.length && line.includes('|') && isTableSeparator(lines[index + 1])) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      output.push(
        <div key={`table-${index}`} className="my-3 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, cellIndex) => (
                  <th key={cellIndex} className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="align-top hover:bg-gray-50/70">
                  {headers.map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-gray-700">
                      {renderInline(row[cellIndex] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      output.push(
        <h3 key={`heading-${index}`} className="mb-1 mt-4 text-base font-bold leading-6 text-gray-950 first:mt-0">
          {renderInline(heading[1])}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (/^[-*_]{3,}$/.test(line.replace(/\s/g, ''))) {
      index += 1;
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*+]\s+/, ''));
        index += 1;
      }
      output.push(
        <ul key={`ul-${index}`} className="my-2 space-y-1.5 pl-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-2.5 leading-6 text-gray-800">
              <span className="mt-[10px] h-1.5 w-1.5 flex-none rounded-full bg-primary/70" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ''));
        index += 1;
      }
      output.push(
        <ol key={`ol-${index}`} className="my-2 space-y-1.5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-2.5 leading-6 text-gray-800">
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[11px] font-bold text-primary">{itemIndex + 1}</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      output.push(
        <blockquote key={`quote-${index}`} className="my-2 border-l-3 border-primary/40 bg-primary/5 px-3 py-2 text-gray-700">
          {renderInline(line.replace(/^>\s?/, ''))}
        </blockquote>,
      );
      index += 1;
      continue;
    }

    output.push(
      <p key={`p-${index}`} className="my-1.5 leading-6 text-gray-800">
        {renderInline(line.replace(/^#{1,6}\s*/, '').replace(/^\*{1,3}\s*/, ''))}
      </p>,
    );
    index += 1;
  }

  return <div className={`text-sm ${className}`.trim()}>{output}</div>;
}
