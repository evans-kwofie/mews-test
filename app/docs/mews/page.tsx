import fs from "fs";
import path from "path";
import { marked } from "marked";

export const metadata = {
  title: "Mews API Summary",
  description: "Engineering reference for the Mews Connector and Booking Engine APIs",
};

export default async function MewsDocsPage() {
  const filePath = path.join(process.cwd(), "mews-api-summary.md");
  const markdown = fs.readFileSync(filePath, "utf-8");
  const html = await marked(markdown);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <article
        className="mx-auto max-w-4xl px-6 py-12 prose prose-invert
          prose-headings:text-gray-100 prose-h1:text-3xl prose-h1:border-b prose-h1:border-gray-700 prose-h1:pb-4
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:border-b prose-h2:border-gray-800 prose-h2:pb-2
          prose-h3:text-xl prose-h3:mt-8 prose-h3:text-gray-200
          prose-p:text-gray-300 prose-li:text-gray-300
          prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-code:text-emerald-400 prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-lg
          prose-table:border-collapse prose-th:bg-gray-800 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border prose-th:border-gray-700
          prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-gray-800
          prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400
          prose-strong:text-gray-100 prose-hr:border-gray-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
