"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatRupiah } from "@/src/lib/utils";

export interface ChartDataPoint {
  label: string;
  income: number;
  expense: number;
}

export function IncomeExpenseChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-text-secondary">
        Tidak ada data pada periode yang dipilih.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e2e8f0"
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#475569" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          width={48}
        />
        <Tooltip
          formatter={(value) => formatRupiah(Number(value ?? 0))}
          contentStyle={{
            borderRadius: 12,
            borderColor: "#e2e8f0",
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="income"
          name="Pemasukan"
          fill="#22c55e"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="Pengeluaran"
          fill="#dc2626"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
