"use client";

import type { ChartData, ChartOptions, Plugin } from "chart.js";
import {
  CategoryScale,
  Chart,
  LineElement,
  LinearScale,
  PointElement,
} from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";

import type { Vote } from "@/drizzle/schema";

Chart.register(CategoryScale);
Chart.register(LinearScale);
Chart.register(PointElement);
Chart.register(LineElement);

const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  animation: false,
  scales: {
    x: {
      title: {
        display: true,
        text: "Number of votes",
        color: "#a8a29e",
      },
    },
    y: {
      title: {
        display: true,
        text: "Left/right ratio",
        color: "#a8a29e",
      },
      min: 0.6,
      max: 1.4,
    },
  },
};

const chartPlugins: Plugin<"line">[] = [
  {
    id: "horizontalLine",
    beforeDraw(chart) {
      const {
        ctx,
        chartArea: { left, right },
        scales: { y },
      } = chart;

      // Line at y=1
      const yPosition = y.getPixelForValue(1);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(left, yPosition);
      ctx.lineTo(right, yPosition);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#44403c";
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "algo-fix-line-1",
    beforeDraw(chart) {
      const {
        ctx,
        chartArea: { top, bottom },
        scales: { x },
      } = chart;

      // Line at x=583, when I implemented the fix for actually
      // randomizing the order on the vote page.
      const xPosition = x.getPixelForValue(510);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPosition, top);
      ctx.lineTo(xPosition, bottom);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#44403c";
      ctx.stroke();
      ctx.restore();
    },
  },
];

export function LeftRightChart({ votes }: { votes: Vote[] }) {
  const data = useMemo<ChartData<"line", number[], number>>(() => {
    const ratios: number[] = [];

    let leftVotes = 0;
    let rightVotes = 0;
    for (const vote of votes) {
      if (vote.winnerId === vote.performance1Id) {
        leftVotes++;
      } else {
        rightVotes++;
      }
      ratios.push(leftVotes / rightVotes);
    }

    const labels = votes.map((_, index) => index + 1);

    return {
      labels,
      datasets: [
        {
          label: "Ratio",
          data: ratios,
          borderColor: "red",
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.0,
        },
      ],
    };
  }, [votes]);

  return (
    <Line
      className="bg-background/70"
      data={data}
      options={chartOptions}
      plugins={chartPlugins}
    />
  );
}
