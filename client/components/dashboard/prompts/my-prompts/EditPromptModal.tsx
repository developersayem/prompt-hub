"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";
import { Upload, X, Coins, Save } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/hooks/API/useCategories";
import { useAiModels } from "@/hooks/API/useAiModels";
import Combobox from "@/components/shared/Combobox";
import { ICategory } from "@/types/category.type";
import { IAiModel } from "@/types/ai-model.types";
import { cn } from "@/lib/utils";
import isValidUrl from "@/helper/check-url";
import isWhitelistedDomain from "@/helper/isWhiteListedDomain";
import { getEmbeddableVideoUrl } from "@/helper/getEmbeddableVideoUrl";

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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    aiModel: "",
    promptText: "",
    resultType: "text",
    resultContent: "",
    tags: [] as string[],
    paymentStatus: "free",
    price: "",
  });

  const [currentTag, setCurrentTag] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const {
    categories,
    categoriesIsLoading,
    categoriesIsError,
    categoriesMutate,
  } = useCategories();

  const { aiModels, aiModelsIsLoading, aiModelsIsError, aiModelsMutate } =
    useAiModels();

  // Load existing prompt data when modal opens
  useEffect(() => {
    if (open && prompt) {
      setFormData({
        title: prompt.title || "",
        description: prompt.description || "",
        category: prompt.category || "",
        aiModel: prompt.aiModel || "",
        promptText: prompt.promptText || "",
        resultType: prompt.resultType || "text",
        resultContent: prompt.resultContent || "",
        tags: prompt.tags || [],
        paymentStatus: prompt.paymentStatus || "free",
        price: prompt.price?.toString() || "",
      });
    }
  }, [open, prompt]);

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
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
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
    data.append("tags", JSON.stringify(formData.tags));
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
      <DialogContent className="max-w-5xl max-h-screen overflow-visible flex flex-col min-h-0">
        <form onSubmit={handleSubmit} className="space-y-2">
          <DialogHeader className="w-full justify-evenly">
            <div className="flex justify-baseline items-center space-x-2">
              <DialogTitle>Create Prompt</DialogTitle>
            </div>
            <DialogDescription>
              Fill in the details and preview will appear inside the upload
              section.
            </DialogDescription>
          </DialogHeader>
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
                <div
                  // onKeyDown={(e) => {
                  //   if (e.key === "Enter") {
                  //     e.stopPropagation();
                  //   }
                  // }}
                  className="space-y-2"
                >
                  <Label>Category</Label>
                  <Combobox<ICategory>
                    options={categories}
                    isLoading={categoriesIsLoading}
                    isError={categoriesIsError}
                    value={
                      categories.find((c) => c.name === formData.category)
                        ?._id || ""
                    }
                    placeholder="Select category..."
                    getLabel={(c) => c.name}
                    getValue={(c) => c._id}
                    onChange={(id) => {
                      const selectedCategory = categories.find(
                        (cat) => cat._id === id
                      );
                      const name = selectedCategory?.name || "";
                      setFormData({ ...formData, category: name });
                    }}
                    onCreateOption={async (input) => {
                      try {
                        const res = await fetch(
                          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories/create`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              name: input,
                              isUserCreated: true,
                            }),
                          }
                        );
                        if (!res.ok)
                          throw new Error((await res.json()).message);
                        const data = await res.json();
                        const newCategory: ICategory = data.data;
                        categoriesMutate();
                        setFormData({
                          ...formData,
                          category: newCategory.name,
                        });
                        toast.success("Category created and selected");
                      } catch (err) {
                        toast.error((err as Error).message);
                      }
                    }}
                  />
                </div>
                <div
                  // onKeyDown={(e) => {
                  //   if (e.key === "Enter") {
                  //     e.stopPropagation();
                  //   }
                  // }}
                  className="space-y-2"
                >
                  <Label>AI Model</Label>
                  <Combobox<IAiModel>
                    options={aiModels}
                    isLoading={aiModelsIsLoading}
                    isError={aiModelsIsError}
                    value={
                      aiModels.find((m) => m.name === formData.aiModel)?._id ||
                      ""
                    } // <- controlled by name
                    placeholder="Select model..."
                    getLabel={(c) => c.name}
                    getValue={(c) => c._id}
                    onChange={(id) => {
                      const selectedModel = aiModels.find((m) => m._id === id);
                      const name = selectedModel?.name || "";
                      setFormData({ ...formData, aiModel: name });
                    }}
                    onCreateOption={async (input) => {
                      try {
                        const res = await fetch(
                          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai-models/create`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              name: input,
                              isUserCreated: true,
                            }),
                          }
                        );
                        if (!res.ok)
                          throw new Error((await res.json()).message);
                        const data = await res.json();
                        const newModel: IAiModel = data.data;
                        aiModelsMutate();
                        setFormData({ ...formData, aiModel: newModel.name });
                        toast.success("AI Model created and selected");
                      } catch (err) {
                        toast.error((err as Error).message);
                      }
                    }}
                  />
                </div>
              </div>
              {/* CREDITS */}
              <>
                <Label>Credits</Label>
                <div className="flex items-center gap-2">
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
                      size="default"
                      className={cn(
                        "text-black dark:text-white border dark:bg-neutral-900"
                      )}
                    >
                      <Coins />
                      <SelectValue
                        placeholder="Select"
                        className={cn(
                          formData.paymentStatus === "paid"
                            ? "text-yellow-900"
                            : "text-green-900"
                        )}
                      />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-full space-y-2">
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
                          setFormData({ ...formData, price: e.target.value })
                        }
                        required={formData.paymentStatus === "paid"}
                        disabled={formData.paymentStatus === "free"}
                      />
                    </div>
                  </div>
                </div>
              </>

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
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(formData.tags) &&
                  formData.tags.map((tag) => (
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

            {/* RESULT TYPE / CATEGORY / FILE */}
            <div className="space-y-6 -mt-10">
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
                      <Label htmlFor={type} className="capitalize">
                        {type}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {formData.resultType !== "text" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Upload File</Label>
                      {uploadedFile && (
                        <button
                          className="bg-red-700 text-white text-xs py-1 px-3 rounded"
                          type="button"
                          onClick={() => {
                            setUploadedFile(null);
                            const fileInput = document.getElementById(
                              "file-upload"
                            ) as HTMLInputElement;
                            if (fileInput) fileInput.value = "";
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="border border-dashed rounded-lg p-4 text-center min-h-[336px] flex items-center justify-center">
                      <input
                        type="file"
                        accept={
                          formData.resultType === "image"
                            ? "image/*"
                            : "video/*"
                        }
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer w-full block"
                      >
                        {uploadedFile ? (
                          formData.resultType === "image" ? (
                            <Image
                              width={300}
                              height={500}
                              src={URL.createObjectURL(uploadedFile)}
                              alt="Preview"
                              className="mx-auto rounded-lg"
                            />
                          ) : (
                            <video
                              src={URL.createObjectURL(uploadedFile)}
                              controls
                              className="mx-auto rounded-lg max-h-[400px]"
                              width="300"
                            />
                          )
                        ) : formData.resultContent ? (
                          formData.resultType === "image" ? (
                            isValidUrl(formData.resultContent) ? (
                              isWhitelistedDomain(formData.resultContent) ? (
                                <Image
                                  width={300}
                                  height={0}
                                  src={formData.resultContent}
                                  alt="Image Link Preview"
                                  className="mx-auto rounded-lg"
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={formData.resultContent}
                                  alt="Image Link Preview"
                                  width={500}
                                  height={0}
                                  className="mx-auto rounded-lg object-contain"
                                />
                              )
                            ) : (
                              <p className="text-sm text-muted-foreground text-center">
                                Invalid image URL
                              </p>
                            )
                          ) : (
                            (() => {
                              const embed = getEmbeddableVideoUrl(
                                isValidUrl(formData.resultContent)
                                  ? formData.resultContent
                                  : "Not valid URL"
                              );
                              if (!embed) {
                                return (
                                  <p className="text-sm text-muted-foreground text-center">
                                    Unsupported or private media URL
                                  </p>
                                );
                              }

                              if (embed.type === "video") {
                                return (
                                  <video
                                    src={embed.url}
                                    controls
                                    className="mx-auto rounded-lg max-h-[400px]"
                                    width="300"
                                  />
                                );
                              }

                              return (
                                <iframe
                                  src={embed.url}
                                  className="mx-auto rounded-lg"
                                  width="300"
                                  height="400"
                                  allowFullScreen
                                />
                              );
                            })()
                          )
                        ) : (
                          <div>
                            <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">
                              Click to upload
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center w-full">
                    <Separator className="max-w-1/2" />
                    <span>OR</span>
                    <Separator className="max-w-1/2" />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {formData.resultType === "image"
                        ? "Image Link"
                        : "Video Link"}
                    </Label>
                    <Input
                      type="url"
                      disabled={uploadedFile !== null}
                      placeholder={`Paste ${formData.resultType} link here (optional)`}
                      value={formData.resultContent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          resultContent: e.target.value,
                        })
                      }
                    />
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
                    className="min-h-[450px]"
                  />
                </div>
              )}
            </div>
          </div>
          {/* ACTION BUTTONS */}
          <div className="flex justify-end space-x-4">
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
