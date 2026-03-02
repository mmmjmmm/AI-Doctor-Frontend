/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const defaultLinkOpen =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token.attrSet("target", "_blank");
  token.attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

md.renderer.rules.paragraph_open = (tokens, idx) => {
  tokens[idx].attrSet(
    "class",
    "text-[15px] leading-6 text-gray-900 mb-2 last:mb-0 whitespace-pre-wrap",
  );
  return "<p" + md.renderer.renderAttrs(tokens[idx]) + ">";
};

md.renderer.rules.heading_open = (tokens, idx) => {
  const tag = tokens[idx].tag;
  const base = "text-gray-900 font-semibold mt-3 mb-2 first:mt-0";
  const size =
    tag === "h1" ? "text-[18px]" : tag === "h2" ? "text-[17px]" : "text-[16px]";
  tokens[idx].attrSet("class", `${base} ${size}`);
  return "<" + tag + md.renderer.renderAttrs(tokens[idx]) + ">";
};

md.renderer.rules.bullet_list_open = (tokens, idx) => {
  tokens[idx].attrSet("class", "list-disc pl-5 mb-2 last:mb-0");
  return "<ul" + md.renderer.renderAttrs(tokens[idx]) + ">";
};

md.renderer.rules.ordered_list_open = (tokens, idx) => {
  tokens[idx].attrSet("class", "list-decimal pl-5 mb-2 last:mb-0");
  return "<ol" + md.renderer.renderAttrs(tokens[idx]) + ">";
};

md.renderer.rules.list_item_open = (tokens, idx) => {
  tokens[idx].attrSet("class", "my-1");
  return "<li" + md.renderer.renderAttrs(tokens[idx]) + ">";
};

md.renderer.rules.code_inline = (tokens, idx) => {
  const content = md.utils.escapeHtml(tokens[idx].content);
  return `<code class="px-1 py-0.5 rounded bg-gray-100 text-[13px] text-gray-900">${content}</code>`;
};

md.renderer.rules.fence = (tokens, idx) => {
  const content = md.utils.escapeHtml(tokens[idx].content);
  return `<pre class="bg-gray-100 rounded-lg p-3 overflow-auto mb-2 last:mb-0"><code class="text-[13px] leading-5 text-gray-900">${content}</code></pre>`;
};

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const safeHtml = useMemo(() => {
    const rawHtml = md.render(content);
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
