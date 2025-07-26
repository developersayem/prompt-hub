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
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ICategory } from "@/types/category.type";
import Combobox from "./Combobox";
import { useCategories } from "@/hooks/API/useCategories";
import { IAiModel } from "@/types/ai-model.types";
import { useAiModels } from "@/hooks/API/useAiModels";
import { Separator } from "../ui/separator";
import isValidUrl from "@/helper/check-url";
import { getEmbeddableVideoUrl } from "@/helper/getEmbeddableVideoUrl";
import isWhitelistedDomain from "@/helper/isWhiteListedDomain";
import { savePromptDraft, savePromptFile } from "@/utils/draftStorage";

export default function CreatePromptModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; // optional
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
  // get categories from useCategories hook
  const {
    categories,
    categoriesIsLoading,
    categoriesIsError,
    categoriesMutate,
  } = useCategories();
  //get ai models from useAiModels hook
  const { aiModels, aiModelsIsLoading, aiModelsIsError, aiModelsMutate } =
    useAiModels();

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

  // Handle save draft
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      title,
      description,
      category,
      aiModel,
      promptText,
      resultType,
      resultContent,
      tags,
      paymentStatus,
      price,
    } = formData;

    if (resultType !== "text" && !uploadedFile && !resultContent.trim()) {
      toast.error("Please upload a file or provide a valid link.");
      return;
    }

    const data = new FormData();
    data.append("title", title);
    data.append("description", description);
    data.append("category", category);
    data.append("aiModel", aiModel);
    data.append("promptText", promptText);
    data.append("resultType", resultType);
    data.append("resultContent", resultContent);
    data.append("paymentStatus", paymentStatus);
    if (paymentStatus === "paid") {
      if (!price || parseFloat(price) <= 0) {
        toast.error("Enter a valid price");
        return;
      }
      data.append("price", price);
    }
    data.append("tags", JSON.stringify(tags));

    if (uploadedFile) {
      data.append("promptContent", uploadedFile);
    }

    try {
      const isOnline = navigator.onLine;
      if (isOnline) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/save-draft`,
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

        setFormData({
          title: "",
          description: "",
          category: "",
          aiModel: "",
          promptText: "",
          resultType: "text",
          resultContent: "",
          tags: [],
          paymentStatus: "free",
          price: "",
        });
        setUploadedFile(null);
        toast.success("Prompt created successfully");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        savePromptDraft(formData);
        if (uploadedFile) await savePromptFile(uploadedFile);
        toast.success("Offline. Prompt saved locally.");
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    // const { user } = useAuth();
    e.preventDefault();

    if (
      formData.resultType !== "text" &&
      !uploadedFile &&
      !formData.resultContent.trim()
    ) {
      toast.error("Please upload a file or provide a valid link.");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("aiModel", formData.aiModel);
    data.append("promptText", formData.promptText);
    data.append("resultType", formData.resultType);
    data.append("resultContent", formData.resultContent);
    data.append("paymentStatus", formData.paymentStatus);
    if (formData.paymentStatus === "paid") {
      data.append("price", formData.price);
    }

    // send tags as JSON string
    data.append("tags", JSON.stringify(formData.tags));

    if (uploadedFile) {
      data.append("promptContent", uploadedFile);
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/create`,
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

      // Clear form data
      setFormData({
        title: "",
        description: "",
        category: "",
        aiModel: "",
        promptText: "",
        resultType: "text",
        resultContent: "",
        tags: [],
        paymentStatus: "free",
        price: "",
      });
      setUploadedFile(null);
      toast.success("Prompt created successfully");
      onClose();
      if (onSuccess) onSuccess();
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
      <DialogContent className="max-w-5xl max-h-screen overflow-visible flex flex-col min-h-0">
        <form onSubmit={handleSubmit} className="space-y-2">
          <DialogHeader className="w-full justify-evenly">
            <div className="flex justify-baseline items-center space-x-2">
              <DialogTitle>Create Prompt</DialogTitle>
              {/* <Select
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
                  className={cn(
                    "text-white border-0",
                    formData.paymentStatus === "paid"
                      ? "bg-blue-900 hover:bg-blue-500"
                      : "bg-green-900 hover:bg-green-500"
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
              </Select> */}
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
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                        "text-white border bg-neutral-900"
                        // formData.paymentStatus === "paid"
                        //   ? "bg-yellow-500 hover:bg-yellow-900"
                        //   : "bg-green-500 hover:bg-green-900"
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

                    <div className="border border-dashed rounded-lg p-4 text-center min-h-[326px] flex items-center justify-center">
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
                    className="min-h-[440px]"
                  />
                </div>
              )}
            </div>
          </div>
          {/* ACTION BUTTONS */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
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
