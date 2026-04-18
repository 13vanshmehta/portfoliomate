import React, { useEffect, useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import OrderedList from '@tiptap/extension-ordered-list';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
} from 'lucide-react';

const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: 'decimal',
        parseHTML: (element) => element.style.listStyleType || element.getAttribute('data-list-style') || 'decimal',
        renderHTML: (attributes) => {
          if (!attributes.listStyleType || attributes.listStyleType === 'decimal') {
            return {};
          }

          return {
            style: `list-style-type: ${attributes.listStyleType};`,
            'data-list-style': attributes.listStyleType,
          };
        },
      },
    };
  },
});

function ToolbarButton({ onClick, isActive, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write your announcement...', minHeight = 220 }) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        orderedList: false,
      }),
      CustomOrderedList,
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
      }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: tiptapEditor }) => {
      onChange?.(tiptapEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    if ((value || '') !== currentHtml) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  const applyListType = (listType) => {
    if (!editor) return;

    if (!editor.isActive('orderedList')) {
      editor.chain().focus().toggleOrderedList().run();
    }

    editor.chain().focus().updateAttributes('orderedList', { listStyleType: listType }).run();
  };

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl || 'https://');

    if (url === null) return;

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
        <div className="h-[44px] border-b border-gray-200 bg-white" />
        <div className="p-5 text-sm text-gray-400" style={{ minHeight }}>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto hidden-scrollbar">
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} title="Paragraph">
          <Pilcrow size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => applyListType('decimal')} isActive={editor.isActive('orderedList', { listStyleType: 'decimal' })} title="Numbered list">
          <ListOrdered size={16} />
        </ToolbarButton>
        <button
          type="button"
          onClick={() => applyListType('upper-alpha')}
          className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
            editor.isActive('orderedList', { listStyleType: 'upper-alpha' })
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="A, B, C list"
        >
          A.
        </button>
        <button
          type="button"
          onClick={() => applyListType('lower-alpha')}
          className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
            editor.isActive('orderedList', { listStyleType: 'lower-alpha' })
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="a, b, c list"
        >
          a.
        </button>
        <button
          type="button"
          onClick={() => applyListType('upper-roman')}
          className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
            editor.isActive('orderedList', { listStyleType: 'upper-roman' })
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="I, II, III list"
        >
          I.
        </button>

        <div className="w-px h-5 bg-gray-200" />

        <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Insert hyperlink">
          <Link2 size={16} />
        </ToolbarButton>
      </div>

      <EditorContent
        editor={editor}
        className="announcement-editor text-[0.95rem] text-gray-800 leading-relaxed bg-[#fafafa]/30 focus-within:bg-white transition-colors"
        style={{ minHeight }}
      />
    </div>
  );
}
