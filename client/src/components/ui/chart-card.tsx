import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCardProps } from "@/lib/types";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function ChartCard({ 
  title, 
  chartId, 
  data, 
  labels, 
  color, 
  borderColor,
  className = "" 
}: ChartCardProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          backgroundColor: color,
          borderColor: borderColor,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false,
            } as any,
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, labels, title, color, borderColor]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full relative">
          <canvas ref={chartRef} id={chartId}></canvas>
        </div>
      </CardContent>
    </Card>
  );
}
