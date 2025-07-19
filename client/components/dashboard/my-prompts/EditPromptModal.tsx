"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import Image from "next/image";
import { Upload, X, Coins, Send } from "lucide-react";
import { IPrompt } from "@/types/prompts.type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

export default function EditPromptModal({
  open,
  onClose,
  prompt,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  prompt: IPrompt;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<IPrompt>(prompt);
  const [currentTag, setCurrentTag] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    setFormData(prompt);
  }, [prompt]);

  const handleAddTag = () => {
    const trimmed = currentTag.trim();
    if (formData.tags.length >= 10) {
      toast.error("Maximum 10 tags allowed");
      return;
    }
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmed] });
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description ?? "");
    data.append("category", formData.category);
    data.append("aiModel", formData.aiModel);
    data.append("promptText", formData.promptText);
    data.append("resultType", formData.resultType);
    data.append("resultContent", formData.resultContent);
    data.append("paymentStatus", formData.paymentStatus);
    if (formData.paymentStatus === "paid") {
      data.append("price", String(formData.price));
    }
    formData.tags.forEach((tag) => data.append("tags", tag));
    if (uploadedFile) {
      data.append("promptContent", uploadedFile);
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/${prompt._id}`,
        {
          method: "PUT",
          body: data,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to update prompt");
      }

      toast.success("Prompt updated successfully");
      onSuccess();
      onClose();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-start items-center gap-2">
            <DialogTitle>Edit Prompt</DialogTitle>

            <Select
              value={formData.paymentStatus}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  paymentStatus: value as "free" | "paid",
                })
              }
            >
              <SelectTrigger
                size="xs"
                className={
                  formData.paymentStatus === "paid"
                    ? "bg-blue-900 hover:bg-yellow-500"
                    : "bg-green-900 hover:bg-green-500"
                }
              >
                <Coins className="mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogDescription>
            Update the prompt information and preview content if needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  value={formData.promptText}
                  onChange={(e) =>
                    setFormData({ ...formData, promptText: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="w-full bg-[#1d1c1c]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="programming">Programming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select
                    value={formData.aiModel}
                    onValueChange={(value) =>
                      setFormData({ ...formData, aiModel: value })
                    }
                  >
                    <SelectTrigger className="w-full bg-[#1d1c1c]">
                      <SelectValue placeholder="Select AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Result Type *</Label>
                <RadioGroup
                  value={formData.resultType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      resultType: value as "text" | "image" | "video",
                    })
                  }
                  className="flex gap-4"
                >
                  {["text", "image", "video"].map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <RadioGroupItem value={type} id={type} />
                      <Label htmlFor={type}>{type}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {formData.resultType !== "text" ? (
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div className="border border-dashed rounded-lg p-4 text-center min-h-[250px] flex items-center justify-center">
                    <input
                      type="file"
                      accept={
                        formData.resultType === "image" ? "image/*" : "video/*"
                      }
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer w-full block"
                    >
                      {!uploadedFile ? (
                        <div>
                          <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            Click to upload
                          </p>
                        </div>
                      ) : formData.resultType === "image" ? (
                        <Image
                          width={200}
                          height={200}
                          src={URL.createObjectURL(uploadedFile)}
                          alt="Preview"
                          className="mx-auto rounded-lg max-h-64"
                        />
                      ) : (
                        <video
                          controls
                          src={URL.createObjectURL(uploadedFile)}
                          className="mx-auto rounded-lg max-h-64 max-w-full"
                        />
                      )}
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Result Text</Label>
                  <Textarea
                    value={formData.resultContent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        resultContent: e.target.value,
                      })
                    }
                    required
                    className="min-h-[250px]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center gap-6">
            <div className="w-full">
              <Label>Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddTag())
                  }
                />
                <Button type="button" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
            </div>

            <div className="w-full mt-4">
              <div className="relative">
                <Coins className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  className="pl-10"
                  min="1"
                  step="0.01"
                  placeholder="Enter credits"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  required={formData.paymentStatus === "paid"}
                  disabled={formData.paymentStatus === "free"}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm"
              >
                <span>#{tag}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => handleRemoveTag(tag)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Send className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
