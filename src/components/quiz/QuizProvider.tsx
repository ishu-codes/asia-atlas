"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useMemo,
  useReducer,
} from "react";
import {
  DEFAULT_SETTINGS,
  type QuizAnswer,
  type QuizQuestion,
  type QuizSettings,
} from "@/lib/quiz";

type QuizStatus = "idle" | "running" | "finished";

export type QuizState = {
  status: QuizStatus;
  settings: QuizSettings;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  currentIndex: number;
  score: number;
  streak: number;
};

const initialState: QuizState = {
  status: "idle",
  settings: DEFAULT_SETTINGS,
  questions: [],
  answers: [],
  currentIndex: 0,
  score: 0,
  streak: 0,
};

type QuizAction =
  | { type: "START"; settings: QuizSettings; questions: QuizQuestion[] }
  | { type: "CONFIRM"; selected: string | null; timedOut?: boolean }
  | { type: "NEXT" }
  | { type: "SKIP_QUESTION"; questionId: number }
  | { type: "FINISH" }
  | { type: "RESET" };

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START":
      return {
        ...initialState,
        status: "running",
        settings: action.settings,
        questions: action.questions,
      };
    case "CONFIRM": {
      const question = state.questions[state.currentIndex];
      if (!question) return state;
      if (state.answers.some((answer) => answer.questionId === question.id)) {
        return state;
      }

      const correct = action.selected === question.correct;
      const answer: QuizAnswer = {
        questionId: question.id,
        selected: action.selected,
        correct,
        timedOut: action.timedOut ?? false,
        skipped: false,
      };

      return {
        ...state,
        answers: [...state.answers, answer],
        score: state.score + (correct ? 1 : 0),
        streak: correct ? state.streak + 1 : 0,
      };
    }
    case "NEXT": {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, status: "finished" };
      }
      return { ...state, currentIndex: nextIndex };
    }
    case "SKIP_QUESTION": {
      const questions = state.questions.filter(
        (question) => question.id !== action.questionId,
      );
      if (state.currentIndex >= questions.length) {
        return { ...state, questions, status: "finished" };
      }
      return { ...state, questions };
    }
    case "FINISH":
      return { ...state, status: "finished" };
    case "RESET":
      return initialState;
  }
}

const QuizContext = createContext<{
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
} | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuiz must be used inside QuizProvider");
  }
  return context;
}
