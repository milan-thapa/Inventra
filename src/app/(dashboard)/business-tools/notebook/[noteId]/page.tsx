// src/app/(dashboard)/business-tools/notebook/[noteId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getNote, updateNote, deleteNote } from "@/lib/actions/note";
import { useProfileStore } from "@/stores/profile-store";
import type { Note } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const activeProfile = useProfileStore((s) => s.getActiveProfile());
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const noteId = params.noteId as string;

  useEffect(() => {
    if (activeProfile && noteId) {
      getNote(activeProfile.id, noteId).then((res) => {
        if (res.data) {
          setNote(res.data);
          setTitle(res.data.title || "");
          setBody(res.data.body || "");
        } else {
          toast({ variant: "destructive", title: "Error", description: "Note not found." });
          router.push("/business-tools/notebook");
        }
        setLoading(false);
      });
    }
  }, [activeProfile, noteId, router, toast]);

  const handleUpdate = async () => {
    if (!activeProfile || !note) return;
    if (!title.trim()) {
        toast({ variant: "destructive", title: "Error", description: "Title is required." });
        return;
    }

    setSaving(true);
    const res = await updateNote(activeProfile.id, note.id, title, body);
    setSaving(false);

    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Note updated successfully" });
    }
  };

  const handleDelete = async () => {
    if (!activeProfile || !note) return;

    setDeleting(true);
    const res = await deleteNote(activeProfile.id, note.id);
    setDeleting(false);

    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Note deleted successfully" });
      router.push("/business-tools/notebook");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/business-tools/notebook")}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground truncate">{note?.title}</h1>
        </div>
        <div className="flex items-center gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-8 px-3 text-xs gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the note.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                        {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" onClick={handleUpdate} disabled={saving}
            className="btn-income h-8 px-3 text-xs gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 p-5">
        <Input
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-bold border-none focus:ring-0 shadow-none px-0"
        />
        <Textarea
          placeholder="Start writing your note here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-4 border-none focus:ring-0 shadow-none px-0 min-h-[400px]"
        />
      </div>
    </div>
  );
}
