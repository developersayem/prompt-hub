"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface Prompt {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  promptText: string;
  resultType: "text" | "image";
  resultContent: string;
}

interface EditPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt;
  onSave: (updatedPrompt: Prompt) => void;
}

export const EditPromptModal = ({
  isOpen,
  onClose,
  prompt,
  onSave,
}: EditPromptModalProps) => {
  const [form, setForm] = useState<Prompt>(prompt);

  useEffect(() => {
    if (prompt) setForm(prompt);
  }, [prompt]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(form); // you can also call your API here
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Prompt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              name="tags"
              value={form.tags.join(", ")}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tags: e.target.value.split(",").map((t) => t.trim()),
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="promptText">Prompt Text</Label>
            <Textarea
              id="promptText"
              name="promptText"
              value={form.promptText}
              onChange={handleChange}
            />
          </div>

          {form.resultType === "text" ? (
            <div>
              <Label htmlFor="resultContent">Result (Text)</Label>
              <Textarea
                id="resultContent"
                name="resultContent"
                value={form.resultContent}
                onChange={handleChange}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="resultContent">Result (Image URL)</Label>
              <Input
                id="resultContent"
                name="resultContent"
                value={form.resultContent}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
