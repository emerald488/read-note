'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

interface AddBookDialogProps {
  onAdd: (book: { title: string; author?: string; total_pages?: number; status?: string }) => Promise<unknown>
}

export function AddBookDialog({ onAdd }: AddBookDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [pages, setPages] = useState('')
  const [status, setStatus] = useState('reading')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await onAdd({
      title: title.trim(),
      author: author.trim() || undefined,
      total_pages: pages ? parseInt(pages) : undefined,
      status,
    })
    setLoading(false)
    setTitle('')
    setAuthor('')
    setPages('')
    setStatus('reading')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Добавить книгу
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая книга</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название книги" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Автор</Label>
            <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Автор" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pages">Количество страниц</Label>
            <Input id="pages" type="number" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="0" min="1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Читаю</SelectItem>
                <SelectItem value="want">Хочу прочитать</SelectItem>
                <SelectItem value="paused">На паузе</SelectItem>
                <SelectItem value="finished">Прочитано</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !title.trim()}>
            {loading ? 'Добавление...' : 'Добавить'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
