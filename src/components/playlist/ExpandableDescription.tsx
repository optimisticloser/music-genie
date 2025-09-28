"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface ExpandableDescriptionProps {
  description: string;
  maxLines?: number;
  className?: string;
}

export function ExpandableDescription({ 
  description, 
  maxLines = 3, 
  className = "" 
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations("common.actions");

  // Check if description is long enough to need expansion
  const isLongDescription = description.length > 300; // Increased threshold

  // Get the appropriate line-clamp class
  const getLineClampClass = (lines: number) => {
    switch (lines) {
      case 1: return 'line-clamp-1';
      case 2: return 'line-clamp-2';
      case 3: return 'line-clamp-3';
      case 4: return 'line-clamp-4';
      case 5: return 'line-clamp-5';
      default: return 'line-clamp-3';
    }
  };

  return (
    <div className={className}>
      <p className={`text-sm md:text-base text-white/80 leading-relaxed ${
        !isExpanded && isLongDescription ? getLineClampClass(maxLines) : ''
      }`}>
        {description}
      </p>
      
      {isLongDescription && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 text-sm text-white/60 hover:text-white/80 transition-colors font-medium"
        >
          {isExpanded ? (
            <>
              {t("viewLess")}
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              {t("viewMore")}
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
