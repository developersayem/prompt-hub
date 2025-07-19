"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <h1 className="text-3xl font-bold">Test Page</h1>
      <p>Count: {count}</p>
      <Button className="mt-4" onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  );
}
