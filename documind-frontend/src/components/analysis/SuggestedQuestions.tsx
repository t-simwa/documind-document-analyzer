import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

interface SuggestedQuestionsProps {
  questions: string[];
  isLoading?: boolean;
  onQuestionClick: (question: string) => void;
}

export const SuggestedQuestions = ({ 
  questions, 
  isLoading, 
  onQuestionClick 
}: SuggestedQuestionsProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-foreground">Suggested questions</p>
        <p className="text-[11px] text-muted-foreground">Click any question to get started</p>
      </div>
      <div className="grid gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="group relative w-full text-left p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2.5">
              <p className="text-xs text-foreground/90 leading-relaxed flex-1 pr-5 group-hover:text-foreground transition-colors">
                {question}
              </p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

