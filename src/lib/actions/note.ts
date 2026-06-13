// src/lib/actions/note.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function getNotes(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const notes = await db.note.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });
    return { data: notes };
  } catch (e) {
    logger.error("Failed to fetch notes", e, { profileId });
    return { error: "Failed to fetch notes" };
  }
}

export async function getNote(profileId: string, noteId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const note = await db.note.findFirst({
            where: { id: noteId, profileId },
        });
        if (!note) return { error: "Note not found" };
        return { data: note };
    } catch (e) {
        logger.error("Failed to fetch note", e, { profileId, noteId });
        return { error: "Failed to fetch note" };
    }
}

export async function createNote(
  profileId: string,
  title: string,
  body: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const note = await db.note.create({
      data: {
        profileId,
        title,
        body,
      },
    });
    revalidatePath("/business-tools/notebook");
    return { data: note };
  } catch (e) {
    logger.error("Failed to create note", e, { profileId });
    return { error: "Failed to create note" };
  }
}

export async function updateNote(
    profileId: string,
    noteId: string,
    title: string,
    body: string
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const note = await db.note.update({
            where: { id: noteId, profileId },
            data: {
                title,
                body,
            },
        });
        revalidatePath(`/business-tools/notebook/${noteId}`);
        revalidatePath("/business-tools/notebook");
        return { data: note };
    } catch (e) {
        logger.error("Failed to update note", e, { profileId, noteId });
        return { error: "Failed to update note" };
    }
}

export async function deleteNote(profileId: string, noteId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await db.note.delete({
      where: { id: noteId, profileId },
    });
    revalidatePath("/business-tools/notebook");
    return { success: true };
  } catch (e) {
    logger.error("Failed to delete note", e, { profileId, noteId });
    return { error: "Failed to delete note" };
  }
}
