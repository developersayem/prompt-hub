"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  Upload,
  X,
  Sparkles,
  DollarSign,
  // Eye,
  // Save,
  Send,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export default function CreatePromptPage() {
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
    previewMode: "full",
  });

  const [currentTag, setCurrentTag] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()],
      });
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (formData.resultType === "image" || formData.resultType === "video") &&
      !uploadedFile
    ) {
      alert("Please upload a file for image or video prompts.");
      return;
    }

    // Prepare formData for sending
    const formDataToSend = new FormData();

    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description || "");
    formDataToSend.append("category", formData.category);
    formDataToSend.append("promptText", formData.promptText);
    formDataToSend.append("resultType", formData.resultType);
    formDataToSend.append("aiModel", formData.aiModel);
    formDataToSend.append("isPaid", String(formData.isPaid));
    formDataToSend.append("price", formData.price || "0");

    // Add tags - append each tag individually
    formData.tags.forEach((tag) => formDataToSend.append("tags", tag));

    if (formData.resultType === "text") {
      formDataToSend.append("resultContent", formData.resultContent);
    } else {
      // image or video => append file
      if (uploadedFile) {
        formDataToSend.append("promptContent", uploadedFile);
      }
    }

    console.log("formDataToSend:", formDataToSend);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/create`,
        {
          method: "POST",
          credentials: "include",
          body: formDataToSend,
        }
      );

      const result = await res.json();

      if (!res.ok) {
        const errorMsg = result.message || "Something went wrong!";
        console.error("Backend error:", errorMsg);
        alert(errorMsg);
        return;
      }

      toast.success("Prompt created!");
      //TODO: window.location.href = "/feed";
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to create prompt");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-neutral-50 dark:bg-neutral-950 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/feed">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Feed
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold">Create New Prompt</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              {/* <Button variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button> */}
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                Publish Prompt
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the essential details about your prompt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter a compelling title for your prompt"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your prompt does and what results it generates"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="programming">Programming</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="entertainment">
                          Entertainment
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aiModel">AI Model Used *</Label>
                    <Select
                      value={formData.aiModel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, aiModel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                        <SelectItem value="claude">Claude</SelectItem>
                        <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
                        <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
                        <SelectItem value="midjourney">Midjourney</SelectItem>
                        <SelectItem value="stable-diffusion">
                          Stable Diffusion
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prompt Content */}
            <Card>
              <CardHeader>
                <CardTitle>Prompt Content</CardTitle>
                <CardDescription>
                  Enter your prompt and upload the generated result
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="promptText">Your Prompt *</Label>
                  <Textarea
                    id="promptText"
                    placeholder="Enter the exact prompt you used to generate the result"
                    rows={4}
                    value={formData.promptText}
                    onChange={(e) =>
                      setFormData({ ...formData, promptText: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label>Result Type *</Label>
                  <RadioGroup
                    value={formData.resultType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, resultType: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text" id="text" />
                      <Label htmlFor="text">Text</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="image" />
                      <Label htmlFor="image">Image</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="video" id="video" />
                      <Label htmlFor="video">Video</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.resultType === "text" ? (
                  <div className="space-y-2">
                    <Label htmlFor="resultContent">Generated Result *</Label>
                    <Textarea
                      id="resultContent"
                      placeholder="Paste the text result generated by the AI"
                      rows={6}
                      value={formData.resultContent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          resultContent: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Upload Result File *</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
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
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.resultType === "image"
                            ? "PNG, JPG, GIF up to 10MB"
                            : "MP4, MOV up to 50MB"}
                        </p>
                      </label>
                      {uploadedFile && (
                        <div className="mt-4 p-2 bg-green-50 rounded-md">
                          <p className="text-sm text-green-700">
                            Uploaded: {uploadedFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Add relevant tags to help users discover your prompt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add tags ex: marketing, AI, writing, etc."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddTag())
                    }
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        #{tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monetization */}
            <Card>
              <CardHeader>
                <CardTitle>Monetization</CardTitle>
                <CardDescription>
                  Choose whether to offer your prompt for free or set a price
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Paid Prompt</Label>
                    <p className="text-sm text-gray-500">
                      Enable to sell your prompt (you keep 90% of revenue)
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPaid}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPaid: checked })
                    }
                  />
                </div>

                {formData.isPaid && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (USD) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0.99"
                          placeholder="9.99"
                          className="pl-10"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          required={formData.isPaid}
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Revenue Breakdown
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">
                            Your earnings (90%):
                          </span>
                          <span className="font-medium text-blue-900">
                            $
                            {formData.price
                              ? (
                                  Number.parseFloat(formData.price) * 0.9
                                ).toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">
                            Platform fee (10%):
                          </span>
                          <span className="font-medium text-blue-900">
                            $
                            {formData.price
                              ? (
                                  Number.parseFloat(formData.price) * 0.1
                                ).toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              {/* <Button type="button" variant="outline">
                Save as Draft
              </Button> */}
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                Publish Prompt
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
