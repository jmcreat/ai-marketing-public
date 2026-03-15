import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Heading3, Undo, Redo } from 'lucide-react'

interface Props {
  content: string
  onChange: (html: string) => void
}

export default function MemoEditor({ content, onChange }: Props) {
  const lastContent = useRef(content)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '오늘의 메모를 작성하세요...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (html !== lastContent.current) {
        lastContent.current = html
        onChange(html)
      }
    },
  })

  // Update content when date changes (new memo loaded)
  useEffect(() => {
    if (editor && content !== lastContent.current) {
      lastContent.current = content
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  if (!editor) return null

  const ToolbarBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="굵게"
        >
          <Bold size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="기울임"
        >
          <Italic size={15} />
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="제목 2"
        >
          <Heading2 size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="제목 3"
        >
          <Heading3 size={15} />
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="목록"
        >
          <List size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="번호 목록"
        >
          <ListOrdered size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="인용"
        >
          <Quote size={15} />
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          title="실행 취소"
        >
          <Undo size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          title="다시 실행"
        >
          <Redo size={15} />
        </ToolbarBtn>
      </div>
      <EditorContent editor={editor} className="min-h-[400px]" />
    </div>
  )
}
