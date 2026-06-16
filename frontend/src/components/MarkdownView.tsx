import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  content: string;
}

/**
 * Renders GitHub-flavored Markdown into a tuned dark `prose` block. Falls back
 * to a muted em-dash when there is no content.
 */
export function MarkdownView({ content }: MarkdownViewProps) {
  if (!content || !content.trim()) {
    return <p className="text-sm text-white/30">—</p>;
  }

  return (
    <div
      className={[
        'prose prose-invert max-w-none',
        'prose-p:my-2 prose-p:leading-relaxed prose-p:text-white/75',
        'prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-white',
        'prose-strong:text-white prose-strong:font-semibold',
        'prose-li:my-1 prose-li:text-white/75 prose-li:marker:text-accent-indigo',
        'prose-ul:my-2 prose-ol:my-2',
        'prose-a:text-accent-blue prose-a:no-underline hover:prose-a:underline',
        'prose-code:rounded prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-accent-pink prose-code:before:content-none prose-code:after:content-none',
        'prose-blockquote:border-accent-indigo/40 prose-blockquote:text-white/60',
        'prose-hr:border-white/10',
      ].join(' ')}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
