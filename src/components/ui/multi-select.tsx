"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "./badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner...",
}: MultiSelectProps) {
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleUnselect = (valueToRemove: string) => {
    onChange(selected.filter((value) => value !== valueToRemove));
  };

  return (
    <div className="relative">
      <div className="w-full min-h-[40px] flex flex-wrap gap-1 p-1 border rounded-md bg-background">
        {selected.length > 0 ? (
          selected.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="mr-1 mb-1"
            >
              {options.find((opt) => opt.value === value)?.label}
              <button
                type="button"
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUnselect(value);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground px-3 py-2">{placeholder}</span>
        )}
      </div>
      <Select
        value="_"
        onValueChange={handleSelect}
      >
        <SelectTrigger className="absolute top-0 left-0 w-full h-full opacity-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={selected.includes(option.value) ? "bg-accent" : ""}
            >
              <div className="flex items-center">
                <div
                  className={`mr-2 h-4 w-4 rounded-sm border flex items-center justify-center ${
                    selected.includes(option.value)
                      ? "bg-primary border-primary"
                      : "border-input"
                  }`}
                >
                  {selected.includes(option.value) && (
                    <span className="h-2 w-2 bg-white rounded-sm" />
                  )}
                </div>
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
