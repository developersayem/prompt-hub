"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import LoadingCom from "./loading-com";

type ComboboxProps<T> = {
  options: T[];
  isLoading?: boolean;
  isError?: boolean;
  value: string;
  placeholder?: string;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  onChange: (value: string) => void;
  onCreateOption?: (input: string) => void; // Optional callback to handle new item
};

export default function Combobox<T>({
  options,
  value,
  isLoading,
  isError,
  placeholder = "Select...",
  getLabel,
  getValue,
  onChange,
  onCreateOption,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((item) =>
    getLabel(item).toLowerCase().includes(query.toLowerCase())
  );

  // Flip dropdown direction
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceAbove > spaceBelow);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    onChange(getValue(item));
    setQuery("");
    setOpen(false);
    setHighlightedIndex(null);
  };

  const handleCreate = () => {
    if (onCreateOption && query.trim()) {
      onCreateOption(query.trim());
      setQuery("");
      setOpen(false);
    }
  };

  if (isLoading) {
    return <LoadingCom />;
  }

  if (isError) {
    return <p className="text-center">Error</p>;
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        ref={buttonRef}
        onClick={() => setOpen((p) => !p)}
        className="w-full bg-transparent dark:bg-[#171616] text-left border-0 border-gray-600 rounded-md px-3 py-1.5 text-white flex items-center justify-between hover:border-gray-400 transition"
      >
        <span>
          {value
            ? getLabel(options.find((o) => getValue(o) === value)!)
            : placeholder}
        </span>
        <ChevronDown size={15} className="text-gray-400" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-full border rounded-md shadow-lg bg-[#272627] transition-all duration-150",
            dropUp ? "bottom-full mb-2" : "mt-2",
            "origin-top scale-100"
          )}
        >
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightedIndex((prev) =>
                  prev === null || prev === filtered.length - 1 ? 0 : prev + 1
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightedIndex((prev) =>
                  prev === null || prev === 0 ? filtered.length - 1 : prev - 1
                );
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (highlightedIndex !== null && filtered[highlightedIndex]) {
                  handleSelect(filtered[highlightedIndex]);
                } else if (filtered.length === 0 && onCreateOption) {
                  handleCreate();
                  console.log("Creating new item:", query);
                }
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className="w-full px-3 py-2 border-b border-gray-700 bg-transparent text-white text-sm focus:outline-none"
          />

          <ul className="max-h-60 overflow-y-auto text-sm">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-gray-400 flex justify-between items-center">
                <span>No items found</span>
                <button
                  onClick={handleCreate}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  + Add
                </button>
              </li>
            ) : (
              filtered.map((item, index) => {
                const isSelected = getValue(item) === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={getValue(item)}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "px-3 py-2 cursor-pointer",
                      isHighlighted
                        ? "bg-neutral-700 text-white"
                        : "hover:bg-neutral-800",
                      isSelected ? "font-medium" : "text-gray-300"
                    )}
                  >
                    {getLabel(item)}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
