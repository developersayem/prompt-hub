"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, Send, Coins, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function CreatePromptModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    aiModel: "",
    promptText: "",
    resultType: "text",
    resultContent: "",
    tags: [] as string[],
    isPaid: false,
    price: "",
  });

  const [currentTag, setCurrentTag] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleAddTag = () => {
    const trimmed = currentTag.trim();
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
    if (formData.resultType !== "text" && !uploadedFile) {
      toast.error("Please upload a file for image or video prompts.");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => data.append("tags", v));
      } else {
        data.append(key, value.toString());
      }
    });
    if (uploadedFile) data.append("promptContent", uploadedFile);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/create`,
        {
          method: "POST",
          body: data,
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create prompt");
      }

      toast.success("Prompt created successfully");
      onClose();
      router.push("/feed");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-screen overflow-y-auto">
        <DialogHeader className="w-full justify-evenly">
          <div className="flex justify-baseline items-center space-x-2">
            <DialogTitle>Create Prompt</DialogTitle>
            <Select
              value={formData.isPaid ? "paid" : "free"}
              onValueChange={(value) =>
                setFormData({ ...formData, isPaid: value === "paid" })
              }
            >
              <SelectTrigger
                size="xs"
                className={cn(
                  "text-white border-0",
                  formData.isPaid
                    ? "bg-blue-900 hover:bg-yellow-500"
                    : "bg-green-900 hover:bg-green-500"
                )}
              >
                <Coins className="" />
                <SelectValue
                  placeholder="Select"
                  className={cn(
                    formData.isPaid ? "text-yellow-900" : "text-green-900"
                  )}
                />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogDescription>
            Fill in the details and preview will appear inside the upload
            section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* TITLE / DESC / PROMPT */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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

            {/* RESULT TYPE / CATEGORY / FILE */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Result Type *</Label>
                <RadioGroup
                  value={formData.resultType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, resultType: value })
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
            {/* TAGS */}
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
            </div>
            {/* MONETIZE */}
            <div className="w-full mt-4">
              <div className="relative">
                <Coins className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  className="pl-10"
                  min="0.99"
                  step="0.01"
                  placeholder="Enter credits"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button type="submit">
              <Send className="h-4 w-4 mr-2" />
              Publish Prompt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
