"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownContentProps {
  content: string
  className?: string
}

/**
 * Renders trusted (admin-authored) Markdown content with GitHub-flavored
 * Markdown support (tables, task lists, strikethrough) and images.
 * Raw HTML is intentionally NOT enabled to avoid XSS.
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("space-y-4 text-sm leading-relaxed break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-2 first:mt-0" {...props} />,
          h2: ({ ...props }) => <h2 className="text-xl font-bold mt-5 mb-2 first:mt-0" {...props} />,
          h3: ({ ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0" {...props} />,
          h4: ({ ...props }) => <h4 className="text-base font-semibold mt-3 mb-1 first:mt-0" {...props} />,
          p: ({ ...props }) => <p className="leading-relaxed" {...props} />,
          a: ({ ...props }) => (
            <a
              className="text-primary underline underline-offset-2 hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          ul: ({ ...props }) => <ul className="list-disc pl-6 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-6 space-y-1" {...props} />,
          li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground" {...props} />
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isBlock = /language-/.test(codeClassName || "")
            if (isBlock) {
              return (
                <code className={cn("block", codeClassName)} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs" {...props}>
                {children}
              </code>
            )
          },
          pre: ({ ...props }) => (
            <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-xs font-mono" {...props} />
          ),
          img: ({ alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={alt || ""}
              className="max-w-full rounded-lg border my-2"
              loading="lazy"
              {...props}
            />
          ),
          hr: ({ ...props }) => <hr className="border-border my-6" {...props} />,
          table: ({ ...props }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: ({ ...props }) => (
            <th className="border border-border bg-muted px-3 py-2 text-left font-semibold" {...props} />
          ),
          td: ({ ...props }) => <td className="border border-border px-3 py-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
