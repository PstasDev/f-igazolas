"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient } from "@/lib/api"
import type { ChangeNote } from "@/lib/change-note-types"
import type { Osztaly } from "@/lib/types"
import { MarkdownContent } from "@/components/MarkdownContent"
import { IconAlertCircle, IconPlus, IconEdit, IconTrash, IconPhoto } from "@tabler/icons-react"
import { format } from "date-fns"
import { hu } from "date-fns/locale"

interface FormState {
  title: string
  content: string
  show_to_students: boolean
  show_to_teachers: boolean
  target_class_ids: number[]
  published: boolean
}

const EMPTY_FORM: FormState = {
  title: "",
  content: "",
  show_to_students: true,
  show_to_teachers: true,
  target_class_ids: [],
  published: false,
}

export function ChangeNoteManagement() {
  const [notes, setNotes] = useState<ChangeNote[]>([])
  const [classes, setClasses] = useState<Osztaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<ChangeNote | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<ChangeNote | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [notesData, classesData] = await Promise.all([
        apiClient.listChangeNotes(),
        apiClient.listOsztaly(),
      ])
      setNotes(notesData)
      setClasses(classesData)
    } catch (err) {
      console.error("Failed to load change notes:", err)
      setError(err instanceof Error ? err.message : "Hiba a bejegyzések betöltése közben")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const openCreateDialog = () => {
    setEditingNote(null)
    setForm(EMPTY_FORM)
    setActiveTab("edit")
    setFormError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (note: ChangeNote) => {
    setEditingNote(note)
    setForm({
      title: note.title,
      content: note.content,
      show_to_students: note.show_to_students,
      show_to_teachers: note.show_to_teachers,
      target_class_ids: note.target_class_ids,
      published: note.published_at !== null,
    })
    setActiveTab("edit")
    setFormError(null)
    setDialogOpen(true)
  }

  const toggleTargetClass = (classId: number) => {
    setForm((prev) => ({
      ...prev,
      target_class_ids: prev.target_class_ids.includes(classId)
        ? prev.target_class_ids.filter((id) => id !== classId)
        : [...prev.target_class_ids, classId],
    }))
  }

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setForm((prev) => ({ ...prev, content: prev.content + text }))
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    setForm((prev) => ({
      ...prev,
      content: prev.content.slice(0, start) + text + prev.content.slice(end),
    }))
    requestAnimationFrame(() => {
      textarea.focus()
      const newPos = start + text.length
      textarea.setSelectionRange(newPos, newPos)
    })
  }

  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    try {
      setUploadingImage(true)
      setFormError(null)
      const response = await apiClient.uploadChangeNoteImage(file)
      insertAtCursor(`![${file.name}](${response.url})`)
    } catch (err) {
      console.error("Failed to upload image:", err)
      setFormError(err instanceof Error ? err.message : "Hiba a kép feltöltése közben")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("A cím és a tartalom megadása kötelező")
      return
    }

    try {
      setSaving(true)
      setFormError(null)

      const publishedAt = form.published
        ? editingNote?.published_at ?? new Date().toISOString()
        : null

      if (editingNote) {
        await apiClient.updateChangeNote(editingNote.id, {
          title: form.title,
          content: form.content,
          show_to_students: form.show_to_students,
          show_to_teachers: form.show_to_teachers,
          target_class_ids: form.target_class_ids,
          published_at: publishedAt,
        })
      } else {
        await apiClient.createChangeNote({
          title: form.title,
          content: form.content,
          show_to_students: form.show_to_students,
          show_to_teachers: form.show_to_teachers,
          target_class_ids: form.target_class_ids,
          published_at: publishedAt,
        })
      }

      setDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error("Failed to save change note:", err)
      setFormError(err instanceof Error ? err.message : "Hiba a mentés közben")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (note: ChangeNote) => {
    setNoteToDelete(note)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!noteToDelete) return
    try {
      await apiClient.deleteChangeNote(noteToDelete.id)
      setDeleteDialogOpen(false)
      setNoteToDelete(null)
      await loadData()
    } catch (err) {
      console.error("Failed to delete change note:", err)
      alert(err instanceof Error ? err.message : "Hiba a törlés közben")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Változás bejegyzések</CardTitle>
            <CardDescription>
              Teljes képernyős, bezárható felugró ablakban megjelenő közlemények kezelése (Markdown formázással, képekkel)
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} className="gap-2 flex-shrink-0">
            <IconPlus className="h-4 w-4" />
            Új bejegyzés
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium break-words">{note.title}</p>
                  <Badge variant={note.is_published ? "default" : "secondary"}>
                    {note.is_published ? "Közzétéve" : "Vázlat"}
                  </Badge>
                  {note.show_to_students && <Badge variant="outline">Diákok</Badge>}
                  {note.show_to_teachers && <Badge variant="outline">Tanárok</Badge>}
                  {note.target_class_names.map((name) => (
                    <Badge key={name} variant="secondary">{name}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Módosítva: {format(new Date(note.updated_at), "yyyy. MMMM d., H:mm", { locale: hu })}
                  {note.created_by_username && ` • ${note.created_by_username}`}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => openEditDialog(note)}>
                  <IconEdit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => confirmDelete(note)}>
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Még nincsenek változás bejegyzések létrehozva.
            </p>
          )}
        </div>
      </CardContent>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Bejegyzés szerkesztése" : "Új bejegyzés"}</DialogTitle>
            <DialogDescription>
              A tartalom Markdown formázást támogat (címsorok, listák, linkek, képek, táblázatok).
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="space-y-4 py-2">
              {formError && (
                <Alert variant="destructive">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="note-title">Cím</Label>
                <Input
                  id="note-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Pl. Új funkció: Változás bejegyzések"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tartalom</Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleImageButtonClick}
                      disabled={uploadingImage}
                      className="gap-1"
                    >
                      {uploadingImage ? <Spinner className="h-3 w-3" /> : <IconPhoto className="h-4 w-4" />}
                      Kép beszúrása
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
                  <TabsList>
                    <TabsTrigger value="edit">Szerkesztés</TabsTrigger>
                    <TabsTrigger value="preview">Előnézet</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit">
                    <Textarea
                      ref={textareaRef}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Írd meg a bejegyzés tartalmát Markdown formázással..."
                      className="min-h-[280px] font-mono text-sm"
                    />
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="min-h-[280px] rounded-md border p-4">
                      {form.content.trim() ? (
                        <MarkdownContent content={form.content} />
                      ) : (
                        <p className="text-sm text-muted-foreground">Nincs megjeleníthető tartalom.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <Label className="text-base">Célközönség</Label>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-students" className="font-normal">Diákoknak mutatva</Label>
                  <Switch
                    id="show-students"
                    checked={form.show_to_students}
                    onCheckedChange={(checked) => setForm({ ...form, show_to_students: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-teachers" className="font-normal">Tanároknak mutatva</Label>
                  <Switch
                    id="show-teachers"
                    checked={form.show_to_teachers}
                    onCheckedChange={(checked) => setForm({ ...form, show_to_teachers: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-normal">
                    Célosztályok (ha egyik sincs kijelölve, minden osztály látja a fenti kapcsolóknak megfelelően)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto rounded-md border p-2">
                    {[...classes].sort((a, b) => a.nev.localeCompare(b.nev, "hu")).map((osztaly) => (
                      <label key={osztaly.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={form.target_class_ids.includes(osztaly.id)}
                          onCheckedChange={() => toggleTargetClass(osztaly.id)}
                        />
                        {osztaly.nev}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="note-published" className="text-base">Közzététel</Label>
                  <p className="text-xs text-muted-foreground">
                    {form.published
                      ? "A bejegyzés megjelenik az érintett felhasználóknak."
                      : "Vázlat - senki sem látja, amíg nincs közzétéve."}
                  </p>
                </div>
                <Switch
                  id="note-published"
                  checked={form.published}
                  onCheckedChange={(checked) => setForm({ ...form, published: checked })}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Mégse
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : "Mentés"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bejegyzés törlése</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan törölni szeretnéd a(z) &quot;{noteToDelete?.title}&quot; bejegyzést? Ez a művelet nem vonható vissza.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Törlés</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
