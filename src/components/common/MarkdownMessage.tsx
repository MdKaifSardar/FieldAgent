'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

function CodeBlock({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If inline code
  if (!match && !String(children).includes('\n')) {
    return (
      <code
        className="px-1.5 py-0.5 rounded text-[12px] font-mono bg-slate-900/90 text-cyan-300 border border-slate-700/60"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950/90 group">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
        <span>{match ? match[1] : 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-3 overflow-x-auto text-[12px] font-mono text-slate-200">
        <pre {...props}>
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = React.memo(({ content, className = '' }) => {
  return (
    <div className={`prose-fieldguard text-slate-100 text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              throwOnError: false,
              errorColor: '#f87171',
              strict: false,
            },
          ],
        ]}
        components={{
          // Paragraph
          p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,

          // Headings
          h1: ({ children }) => <h1 className="text-base font-bold text-white mt-3 mb-1.5">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-3 mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-cyan-300 mt-2 mb-1">{children}</h3>,
          h4: ({ children }) => <h4 className="text-xs font-semibold text-slate-200 mt-2 mb-1 uppercase tracking-wider">{children}</h4>,

          // Bold & Emphasis
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-300">{children}</em>,

          // Lists
          ul: ({ children }) => <ul className="my-2 space-y-1 list-disc list-inside pl-1 text-slate-200">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 space-y-1 list-decimal list-inside pl-1 text-slate-200">{children}</ol>,
          li: ({ children }) => <li className="text-slate-200 leading-normal">{children}</li>,

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 pl-3 border-l-2 border-cyan-400/70 bg-cyan-950/20 py-1.5 pr-2 rounded-r-md text-xs italic text-cyan-200">
              {children}
            </blockquote>
          ),

          // Code
          code: CodeBlock,

          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-slate-700/80 bg-slate-900/60 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-950/80 border-b border-slate-700 text-slate-200 font-semibold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-800">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-slate-800/40 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 font-medium text-cyan-300">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-slate-300">{children}</td>,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),

          // Horizontal rule
          hr: () => <hr className="my-3 border-slate-700/60" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownMessage.displayName = 'MarkdownMessage';
