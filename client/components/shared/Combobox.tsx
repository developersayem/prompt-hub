"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDown } from "lucide-react";
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
  onCreateOption?: (input: string) => void;
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

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceAbove > spaceBelow);
    }
  }, [open]);

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

  if (isLoading) return <LoadingCom />;
  if (isError)
    return <p className="text-center text-red-500">Error loading options</p>;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full text-left px-3 py-2 border rounded-md flex items-center justify-between transition 
          bg-white text-black border-gray-300 
          hover:border-gray-400 
          dark:bg-[#171616] dark:text-white dark:border-gray-700 dark:hover:border-gray-500"
      >
        <span>
          {value
            ? getLabel(options.find((o) => getValue(o) === value)!)
            : placeholder}
        </span>
        <ChevronDown size={15} className="text-gray-400 dark:text-gray-300" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-full max-h-60 mt-2 border rounded-md shadow-lg overflow-hidden transition-all duration-150",
            dropUp ? "bottom-full mb-2" : "top-full",
            "bg-white dark:bg-[#272627] text-black dark:text-white border-gray-200 dark:border-gray-700"
          )}
        >
          <input
            type="text"
            placeholder="Search..."
            value={query}
            autoFocus
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
                }
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className="w-full px-3 py-2 border-b text-sm outline-none bg-white dark:bg-[#272627] dark:text-white dark:border-gray-700 border-gray-200"
          />

          <ul className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 text-sm">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-gray-500 dark:text-gray-400 flex justify-between items-center">
                <span>No items found</span>
                {onCreateOption && (
                  <button
                    onClick={handleCreate}
                    className="text-blue-500 hover:underline"
                  >
                    + Add
                  </button>
                )}
              </li>
            ) : (
              filtered.map((item, index) => {
                const isSelected = getValue(item) === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={getValue(item)}
                    tabIndex={0}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "px-3 py-2 cursor-pointer flex items-center justify-between transition",
                      isHighlighted && "bg-neutral-100 dark:bg-neutral-700",
                      isSelected &&
                        "bg-neutral-200 dark:bg-neutral-800 font-medium"
                    )}
                  >
                    {getLabel(item)}
                    {isSelected && <CheckIcon className="size-4 ml-2" />}
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
