"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

interface RefinedFormFieldProps {
  label: string;
  icon?: React.ReactNode;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  helperText?: string;
}

export function RefinedFormField({
  label,
  icon,
  iconColor = "text-[#4B7EFC]",
  children,
  className,
  helperText
}: RefinedFormFieldProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center gap-2 text-gray-700 font-semibold px-1">
        {icon && <span className={cn("shrink-0", iconColor)}>{icon}</span>}
        <Label className="text-[14px] sm:text-[15px] font-semibold">{label}</Label>
      </div>
      <div className="relative group">
        {children}
      </div>
      {helperText && (
        <p className="text-[11px] text-gray-400 font-medium px-1 leading-tight italic">
          {helperText}
        </p>
      )}
    </div>
  );
}
