import { openDB } from "idb";

interface PromptDraft {
  title: string;
  description: string;
  category: string;
  aiModel: string;
  promptText: string;
  resultType: string;
  resultContent: string;
  tags: string[];
  paymentStatus: string;
  price: string;
}

const LOCAL_STORAGE_KEY = "prompt-draft";
const DB_NAME = "PromptDB";
const STORE_NAME = "files";

// Ensure the object store always exists
async function getDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}


// Save text-based draft to localStorage
export function savePromptDraft(data: PromptDraft) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save draft:", err);
  }
}

// Load draft from localStorage
export function loadPromptDraft(): PromptDraft | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to load draft:", err);
    return null;
  }
}

// Save file to IndexedDB
export async function savePromptFile(file: File) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    await tx.objectStore(STORE_NAME).put(file, "uploadedFile");
    await tx.done;
  } catch (err) {
    console.error("Failed to save file to IndexedDB:", err);
  }
}

// Load file from IndexedDB
export async function loadPromptFile(): Promise<File | null> {
  try {
    const db = await getDB();
    return db.transaction(STORE_NAME).objectStore(STORE_NAME).get("uploadedFile");
  } catch (err) {
    console.error("Failed to load file from IndexedDB:", err);
    return null;
  }
}

// Clear file from IndexedDB
export async function clearPromptFile() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    await tx.objectStore(STORE_NAME).delete("uploadedFile");
    await tx.done;
  } catch (err) {
    console.error("Failed to clear file from IndexedDB:", err);
  }
}

// Clear draft from localStorage
export function clearPromptDraft() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear draft:", err);
  }
}
