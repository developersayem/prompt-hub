"use client";

import { Button } from "@/components/ui/button";

export default function TestPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold">Test Page</h1>
      <Button className="mt-4">Click me</Button>
    </div>
  );
}
