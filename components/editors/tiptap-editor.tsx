"use client";

import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Hash,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Palette,
  Quote,
  Redo,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minimal?: boolean;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Commencez à écrire...",
  editable = true,
  className,
  minimal = false,
}: TipTapEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const _timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>(content);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();

      // Mettre à jour le formulaire sans déclencher de soumission automatique
      if (newContent !== lastContentRef.current) {
        lastContentRef.current = newContent;
        onChange(newContent);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
          "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
          "prose-code:text-foreground prose-blockquote:text-foreground prose-li:text-foreground",
          "prose-a:text-primary hover:prose-a:text-primary/80",
          // Styles personnalisés pour les titres
          "prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4",
          "prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3",
          "prose-h4:text-lg prose-h4:font-medium prose-h4:mt-4 prose-h4:mb-2",
          "min-h-[200px] p-4",
          className
        ),
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt("URL de l'image");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("URL du lien", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  if (minimal) {
    return (
      <div className={cn("border rounded-md", className)}>
        {/* Toolbar minimal */}
        <div className="border-b p-2">
          <div className="flex flex-wrap gap-1">
            <Button
              variant={editor.isActive("bold") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("italic") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("bulletList") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("orderedList") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <EditorContent editor={editor} className="min-h-[100px]" />
      </div>
    );
  }

  return (
    <div className={cn("border rounded-md", className)}>
      {/* Toolbar complet */}
      <div className="border-b p-2">
        <div className="flex flex-wrap gap-1">
          {/* Format du texte */}
          <div className="flex gap-1">
            <Button
              variant={editor.isActive("bold") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Gras"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("italic") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italique"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("underline") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Souligné"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("strike") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Barré"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("code") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Code"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Titres */}
          <div className="flex gap-1">
            <Button
              variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Titre 2 (Sous-titre principal)"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Titre 3 (Sous-titre secondaire)"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("heading", { level: 4 }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              title="Titre 4 (Sous-titre tertiaire)"
            >
              <Hash className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Listes et citation */}
          <div className="flex gap-1">
            <Button
              variant={editor.isActive("bulletList") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Liste à puces"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("orderedList") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Liste numérotée"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("blockquote") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Citation"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignement */}
          <div className="flex gap-1">
            <Button
              variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              title="Aligner à gauche"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              title="Centrer"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              title="Aligner à droite"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: "justify" }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              title="Justifier"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Couleurs et surlignage */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Couleur du texte"
            >
              <Palette className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              title="Surlignage"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Média et liens */}
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={addImage} title="Insérer une image">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={setLink} title="Insérer un lien">
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={addTable} title="Insérer un tableau">
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Annuler/Refaire */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Annuler"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Refaire"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sélecteur de couleur */}
        {showColorPicker && (
          <div className="mt-2 p-2 border rounded bg-background">
            <div className="grid grid-cols-8 gap-1">
              {[
                "#000000",
                "#374151",
                "#DC2626",
                "#EA580C",
                "#CA8A04",
                "#65A30D",
                "#059669",
                "#0891B2",
                "#3B82F6",
                "#6366F1",
                "#8B5CF6",
                "#A21CAF",
                "#BE185D",
                "#E11D48",
                "#F97316",
                "#EAB308",
              ].map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setShowColorPicker(false);
              }}
            >
              Supprimer la couleur
            </Button>
          </div>
        )}

        {/* Sélecteur de surlignage */}
        {showHighlightPicker && (
          <div className="mt-2 p-2 border rounded bg-background">
            <div className="grid grid-cols-8 gap-1">
              {[
                "#FEF3C7",
                "#FDE68A",
                "#FCD34D",
                "#F59E0B",
                "#FEE2E2",
                "#FECACA",
                "#F87171",
                "#DC2626",
                "#DBEAFE",
                "#BFDBFE",
                "#60A5FA",
                "#3B82F6",
                "#D1FAE5",
                "#A7F3D0",
                "#34D399",
                "#10B981",
              ].map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setHighlight({ color }).run();
                    setShowHighlightPicker(false);
                  }}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setShowHighlightPicker(false);
              }}
            >
              Supprimer le surlignage
            </Button>
          </div>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
