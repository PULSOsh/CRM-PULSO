"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

type CashFlowData = {
  day: string;
  net: number;
};

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function CashFlowChart({ data }: { data: CashFlowData[] }) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      dateFormatted: new Date(d.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      isPositive: d.net >= 0
    }));
  }, [data]);

  return (
    <div className="h-56 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="dateFormatted" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }}
            tickFormatter={(value) => 
              new Intl.NumberFormat("pt-BR", { notation: "compact", compactDisplay: "short" }).format(value)
            }
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const isPositive = payload[0].payload.isPositive;
                return (
                  <div className="rounded-xl bg-black/90 border border-white/10 px-4 py-3 text-sm text-white shadow-2xl ">
                    <p className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
                    <p className={`font-black tracking-tighter ${isPositive ? "text-orange-400" : "text-rose-400"}`}>
                      {currency(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="net" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isPositive ? "#f97316" : "#e11d48"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
