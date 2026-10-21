import type { AIResult, Question } from "../types";
import type { SurveyStats } from "../stats";

export interface ReportSnapshot {
  survey: { title: string; description: string; questions: Question[] };
  stats: SurveyStats;
  analysis: AIResult;
  model: string;
  filter: string;
  createdAt: number;
  author: string;
  institution: string;
}
