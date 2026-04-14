"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  orders: {
    label: "Orders",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatTick(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Matches seller dashboard API: last 30 calendar days in UTC, zero-filled. */
function last30DaysPlaceholder(): { date: string; orders: number }[] {
  const out: { date: string; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), orders: 0 });
  }
  return out;
}

export function SellerOrdersChart({
  data,
  isLoading,
}: {
  data: { date: string; orders: number }[];
  isLoading: boolean;
}) {
  const gradientId = `sellerOrdersFill-${React.useId().replace(/:/g, "")}`;

  const chartData = React.useMemo(() => {
    const rows = data.length > 0 ? data : last30DaysPlaceholder();
    return rows.map((row) => ({
      date: row.date,
      orders: Number(row.orders) || 0,
    }));
  }, [data]);

  const yAxisMax = React.useMemo(() => {
    const max = Math.max(0, ...chartData.map((d) => d.orders));
    if (max === 0) return 4;
    return Math.max(2, Math.ceil(max * 1.12));
  }, [chartData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Order volume from your shop over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] h-[250px] w-full">
          <AreaChart accessibilityLayer data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-orders)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-orders)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={24}
              tickFormatter={formatTick}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, yAxisMax]}
              width={40}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(value) =>
                    value != null && value !== "" ? formatTick(String(value)) : ""
                  }
                />
              }
            />
            <Area
              dataKey="orders"
              fill={`url(#${gradientId})`}
              stroke="var(--color-orders)"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
