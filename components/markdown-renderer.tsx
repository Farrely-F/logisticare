'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-slate max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 dark:text-gray-300">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-gray-100">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800 dark:text-gray-200">
              {children}
            </em>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 mb-4">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}