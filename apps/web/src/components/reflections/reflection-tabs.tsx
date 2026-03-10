"use client";

import { Button } from "@/components/ui/button";

type ReflectionTabKey = "clean" | "refined";

type ReflectionTabsProps = {
  activeTab: ReflectionTabKey;
  onTabChange: (nextTab: ReflectionTabKey) => void;
};

export function ReflectionTabs({ activeTab, onTabChange }: ReflectionTabsProps) {
  return (
    <div className="inline-flex rounded-xl border border-night-700 bg-night-950/75 p-1">
      <Button
        size="sm"
        variant={activeTab === "clean" ? "primary" : "ghost"}
        onClick={() => onTabChange("clean")}
      >
        Clean transcript
      </Button>
      <Button
        size="sm"
        variant={activeTab === "refined" ? "primary" : "ghost"}
        onClick={() => onTabChange("refined")}
      >
        Refined text
      </Button>
    </div>
  );
}
