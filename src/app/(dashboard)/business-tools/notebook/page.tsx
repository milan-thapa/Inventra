// src/app/(dashboard)/business-tools/notebook/page.tsx
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotes } from "@/lib/actions/note";
import { getActiveProfile } from "@/lib/actions/profile";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Notebook" };

export default async function NotebookPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const profileRes = await getActiveProfile();
    if (!profileRes.data) redirect("/onboarding");

    const notesRes = await getNotes(profileRes.data.id);
    const notes = notesRes.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">Notebook</h1>
        <Link href="/business-tools/notebook/create">
          <Button size="sm" className="btn-income h-8 px-3 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Note
          </Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No notes yet</h3>
          <p className="text-xs text-muted-foreground mb-4">Create your first note to get started</p>
          <Link href="/business-tools/notebook/create">
            <Button size="sm" className="btn-income h-8 px-3 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Create Note
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {notes.map((note) => (
                <Link href={`/business-tools/notebook/${note.id}`} key={note.id}>
                    <div className="bg-card rounded-xl border border-border/50 p-4 h-full flex flex-col hover:border-emerald-500/50 transition-colors">
                        <h3 className="font-bold text-foreground mb-2 truncate">{note.title}</h3>
                        <p className="text-sm text-muted-foreground flex-grow_
                        overflow-hidden_
                        text-ellipsis_
                        whitespace-nowrap_
                        max-h-24_
                        ">{note.body}</p>
                        <p className="text-xs text-muted-foreground/60 mt-4">
                            {formatDate(new Date(note.updatedAt), "dd MMM yyyy")}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
      )}
    </div>
  );
}
