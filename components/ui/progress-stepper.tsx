"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function ProgressStepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: ProgressStepperProps) {
  const getStepStatus = (stepId: number) => {
    if (completedSteps.has(stepId)) return "completed";
    if (stepId === currentStep) return "current";
    return "pending";
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => onStepClick && onStepClick(step.id)}
                  disabled={!onStepClick || status === "pending"}
                  className={cn(
                    "relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all shrink-0",
                    status === "completed" &&
                      "bg-gold border-gold text-richblack",
                    status === "current" &&
                      "bg-gold/20 border-gold text-gold ring-2 sm:ring-4 ring-gold/20",
                    status === "pending" &&
                      "bg-background border-muted-foreground/25 text-muted-foreground",
                    onStepClick &&
                      status !== "pending" &&
                      "cursor-pointer hover:scale-110",
                    !onStepClick && "cursor-default"
                  )}
                >
                  {status === "completed" ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold">{step.id}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-1 sm:mt-2 text-center min-w-0 w-full px-0.5">
                  <p
                    className={cn(
                      "text-[10px] sm:text-xs font-medium truncate w-full",
                      status === "current" && "text-gold",
                      status === "completed" && "text-foreground",
                      status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 hidden sm:block truncate">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "mx-1 sm:mx-2 h-0.5 flex-1 min-w-[8px] transition-colors shrink",
                    completedSteps.has(step.id) || currentStep > step.id
                      ? "bg-gold"
                      : "bg-muted-foreground/25"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-300 ease-out"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Step {currentStep} of {steps.length}
        </p>
      </div>
    </div>
  );
}
