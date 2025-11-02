"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Code,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor = ({
  value = "",
  onChange = () => {},
  placeholder = "Write something...",
  minHeight = "200px",
}: RichTextEditorProps) => {
  const [activeTab, setActiveTab] = useState("edit");

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  const insertMarkdown = (
    markdownSyntax: string,
    selectionWrapper?: [string, string]
  ) => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let newText;
    if (selectionWrapper && selectedText) {
      // If text is selected and we have wrappers, wrap the selected text
      newText =
        beforeText +
        selectionWrapper[0] +
        selectedText +
        selectionWrapper[1] +
        afterText;
    } else {
      // Otherwise insert markdown at cursor position
      newText = beforeText + markdownSyntax + afterText;
    }

    handleChange(newText);

    // Set focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPos =
        selectionWrapper && selectedText
          ? start +
            selectionWrapper[0].length +
            selectedText.length +
            selectionWrapper[1].length
          : start + markdownSyntax.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    // This is a very basic markdown renderer for preview
    // In a real app, you would use a proper markdown library
    let html = text
      // Headers
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Links
      .replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      // Lists
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.+<\/li>\n?)+/g, "<ul>$&</ul>")
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.+<\/li>\n?)+/g, "<ol>$&</ol>")
      // Code blocks
      .replace(/```([\s\S]+?)```/g, "<pre><code>$1</code></pre>")
      // Inline code
      .replace(/`(.+?)`/g, "<code>$1</code>")
      // Blockquotes
      .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
      // Line breaks
      .replace(/\n/g, "<br />");

    return html;
  };

  return (
    <Card className="w-full bg-background border">
      <div className="p-2 border-b flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("**Bold text**", ["**", "**"])}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("*Italic text*", ["*", "*"])}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("# Heading 1")}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("## Heading 2")}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("### Heading 3")}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("- List item")}
          title="Unordered List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("1. List item")}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            insertMarkdown("[Link text](https://example.com)", [
              "[",
              "](https://example.com)",
            ])
          }
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("`Code`", ["`", "`"])}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("> Blockquote")}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              /* Implement undo */
            }}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              /* Implement redo */
            }}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 py-2 border-b">
          <TabsList className="grid w-40 grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-0">
          <TabsContent value="edit" className="mt-0 border-none">
            <Textarea
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              className="border-none rounded-none focus-visible:ring-0 min-h-[200px]"
              style={{ minHeight }}
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-0 border-none">
            <div
              className="p-4 prose prose-sm max-w-none min-h-[200px] whitespace-pre-wrap"
              style={{ minHeight }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default RichTextEditor;

