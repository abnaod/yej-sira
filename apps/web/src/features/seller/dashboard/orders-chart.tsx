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
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatTick(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function SellerOrdersChart({
  data,
  isLoading,
}: {
  data: { date: string; orders: number }[];
  isLoading: boolean;
}) {
  const gradientId = `sellerOrdersFill-${React.useId().replace(/:/g, "")}`;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="pl-0">
          <Skeleton className="h-[240px] w-full" />
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
      <CardContent className="pl-0">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto min-h-[240px] w-full"
        >
          <AreaChart accessibilityLayer data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-orders)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-orders)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={formatTick}
            />
            <YAxis allowDecimals={false} width={36} tickLine={false} axisLine={false} />
            <ChartTooltip
              cursor={{ stroke: "var(--color-border)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => formatTick(String(label))}
                  indicator="line"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="var(--color-orders)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
