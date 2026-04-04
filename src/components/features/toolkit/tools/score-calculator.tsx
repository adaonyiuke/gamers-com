"use client";

import { useReducer, useCallback } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ─── State ──────────────────────────────────────────────────────────────────

type Operator = "+" | "-" | "×" | "÷";

type CalcState = {
  display: string;
  previousValue: number | null;
  operator: Operator | null;
  waitingForOperand: boolean;
  history: number[];
};

type CalcAction =
  | { type: "DIGIT"; digit: string }
  | { type: "OPERATOR"; operator: Operator }
  | { type: "EQUALS" }
  | { type: "DECIMAL" }
  | { type: "TOGGLE_SIGN" }
  | { type: "PERCENT" }
  | { type: "CLEAR" }
  | { type: "BACKSPACE" }
  | { type: "LOAD_HISTORY"; value: number };

const initialState: CalcState = {
  display: "0",
  previousValue: null,
  operator: null,
  waitingForOperand: false,
  history: [],
};

function compute(left: number, op: Operator, right: number): number {
  switch (op) {
    case "+": return left + right;
    case "-": return left - right;
    case "×": return left * right;
    case "÷": return right !== 0 ? left / right : 0;
  }
}

function formatDisplay(value: number): string {
  // Avoid floating point artifacts — cap at 10 significant digits
  const str = parseFloat(value.toPrecision(10)).toString();
  return str.length > 12 ? value.toExponential(6) : str;
}

function calcReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case "DIGIT": {
      if (state.waitingForOperand) {
        return { ...state, display: action.digit, waitingForOperand: false };
      }
      const next = state.display === "0" ? action.digit : state.display + action.digit;
      if (next.replace(/[^0-9]/g, "").length > 12) return state;
      return { ...state, display: next };
    }

    case "DECIMAL": {
      if (state.waitingForOperand) {
        return { ...state, display: "0.", waitingForOperand: false };
      }
      if (state.display.includes(".")) return state;
      return { ...state, display: state.display + "." };
    }

    case "OPERATOR": {
      const current = parseFloat(state.display);
      if (state.operator && !state.waitingForOperand) {
        const result = compute(state.previousValue!, state.operator, current);
        return {
          ...state,
          display: formatDisplay(result),
          previousValue: result,
          operator: action.operator,
          waitingForOperand: true,
        };
      }
      return {
        ...state,
        previousValue: current,
        operator: action.operator,
        waitingForOperand: true,
      };
    }

    case "EQUALS": {
      if (state.operator == null || state.previousValue == null) return state;
      const current = parseFloat(state.display);
      const result = compute(state.previousValue, state.operator, current);
      const formatted = formatDisplay(result);
      return {
        display: formatted,
        previousValue: null,
        operator: null,
        waitingForOperand: true,
        history: [result, ...state.history].slice(0, 8),
      };
    }

    case "TOGGLE_SIGN": {
      if (state.display === "0") return state;
      return {
        ...state,
        display: state.display.startsWith("-")
          ? state.display.slice(1)
          : "-" + state.display,
      };
    }

    case "PERCENT": {
      const val = parseFloat(state.display) / 100;
      return { ...state, display: formatDisplay(val) };
    }

    case "CLEAR":
      return initialState;

    case "BACKSPACE": {
      if (state.waitingForOperand) return state;
      const next = state.display.length > 1 ? state.display.slice(0, -1) : "0";
      return { ...state, display: next };
    }

    case "LOAD_HISTORY":
      return { ...state, display: formatDisplay(action.value), waitingForOperand: true };

    default:
      return state;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ScoreCalculator() {
  const [state, dispatch] = useReducer(calcReducer, initialState);

  const d = useCallback(
    (type: CalcAction["type"], payload?: any) => () =>
      dispatch({ type, ...payload } as CalcAction),
    []
  );

  const displaySize =
    state.display.length > 10
      ? "text-[24px]"
      : state.display.length > 7
        ? "text-[32px]"
        : "text-[40px]";

  return (
    <div className="pb-4">
      {/* History chips */}
      {state.history.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
          {state.history.map((val, i) => (
            <button
              key={i}
              onClick={() => dispatch({ type: "LOAD_HISTORY", value: val })}
              className="shrink-0 bg-gray-100 rounded-full px-3 py-1.5 text-[13px] font-medium text-gray-600 active:bg-gray-200 transition-colors"
            >
              {formatDisplay(val)}
            </button>
          ))}
        </div>
      )}

      {/* Display */}
      <div className="flex items-center justify-end gap-2 mb-4 min-h-[56px]">
        <p
          className={cn(
            "font-light text-gray-900 text-right flex-1 truncate",
            displaySize
          )}
        >
          {state.display}
        </p>
        <button
          onClick={() => dispatch({ type: "BACKSPACE" })}
          className="p-2 text-gray-400 active:text-gray-600 transition-colors"
          aria-label="Backspace"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>

      {/* Button grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Row 1: AC, ±, %, ÷ */}
        <FnButton onClick={d("CLEAR")}>AC</FnButton>
        <FnButton onClick={d("TOGGLE_SIGN")}>±</FnButton>
        <FnButton onClick={d("PERCENT")}>%</FnButton>
        <OpButton
          active={state.operator === "÷" && state.waitingForOperand}
          onClick={() => dispatch({ type: "OPERATOR", operator: "÷" })}
          aria-label="Divide"
        >
          ÷
        </OpButton>

        {/* Row 2: 7, 8, 9, × */}
        <NumButton onClick={d("DIGIT", { digit: "7" })}>7</NumButton>
        <NumButton onClick={d("DIGIT", { digit: "8" })}>8</NumButton>
        <NumButton onClick={d("DIGIT", { digit: "9" })}>9</NumButton>
        <OpButton
          active={state.operator === "×" && state.waitingForOperand}
          onClick={() => dispatch({ type: "OPERATOR", operator: "×" })}
          aria-label="Multiply"
        >
          ×
        </OpButton>

        {/* Row 3: 4, 5, 6, - */}
        <NumButton onClick={d("DIGIT", { digit: "4" })}>4</NumButton>
        <NumButton onClick={d("DIGIT", { digit: "5" })}>5</NumButton>
        <NumButton onClick={d("DIGIT", { digit: "6" })}>6</NumButton>
        <OpButton
          active={state.operator === "-" && state.waitingForOperand}
          onClick={() => dispatch({ type: "OPERATOR", operator: "-" })}
          aria-label="Subtract"
        >
          −
        </OpButton>

        {/* Row 4: 1, 2, 3, + */}
        <NumButton onClick={d("DIGIT", { digit: "1" })}>1</NumButton>
        <NumButton onClick={d("DIGIT", { digit: "2" })}>2</NumButton>
        <NumButton onClick={d("DIGIT", { digit: "3" })}>3</NumButton>
        <OpButton
          active={state.operator === "+" && state.waitingForOperand}
          onClick={() => dispatch({ type: "OPERATOR", operator: "+" })}
          aria-label="Add"
        >
          +
        </OpButton>

        {/* Row 5: 0 (wide), ., = */}
        <NumButton onClick={d("DIGIT", { digit: "0" })} className="col-span-2">
          0
        </NumButton>
        <NumButton onClick={d("DECIMAL")}>.</NumButton>
        <OpButton
          onClick={() => dispatch({ type: "EQUALS" })}
          aria-label="Equals"
        >
          =
        </OpButton>
      </div>
    </div>
  );
}

// ─── Button Components ──────────────────────────────────────────────────────

function NumButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-white border border-gray-200 rounded-[14px] h-[52px] text-[22px] font-medium text-gray-900 active:bg-gray-100 active:scale-[0.96] transition-all",
        className
      )}
    >
      {children}
    </button>
  );
}

function OpButton({
  children,
  onClick,
  active,
  ...props
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[14px] h-[52px] text-[22px] font-semibold active:scale-[0.96] transition-all",
        active
          ? "bg-white text-[#842AEB] border-2 border-[#842AEB]"
          : "bg-[#842AEB] text-white active:bg-[#6B20C5]"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function FnButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-100 text-gray-700 rounded-[14px] h-[52px] text-[18px] font-medium active:bg-gray-200 active:scale-[0.96] transition-all"
    >
      {children}
    </button>
  );
}
