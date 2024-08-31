"use client"

import React, { useState, useEffect } from "react"
import { TrendingUp, Play, Pause, Plus, Minus, Clock, Target } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const chartConfig = {
    distance: {
        label: "Miles",
        color: "hsl(var(--chart-1))",
    },
    reference: {
        label: "Reference",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

interface ChartDataPoint {
    time: number;
    distance: number;
    reference: number;
}

interface RunChartProps {
    data: ChartDataPoint[];
    maxTime: number;
}

const RunChart: React.FC<RunChartProps> = ({ data, maxTime }) => {
    const maxDistance = Math.max(...data.map(d => Math.max(d.distance, d.reference)));

    return (
        <ResponsiveContainer width="100%" height={400}>
            <ChartContainer config={chartConfig}>
                <AreaChart
                    accessibilityLayer
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="time"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => {
                            if (value >= 300) {
                                return `${Math.floor(value / 60)}m`
                            }
                            return `${value}s`
                        }}
                        domain={[0, maxTime]}
                    />
                    <YAxis
                        dataKey="distance"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `${value.toFixed(2)}mi`}
                        domain={[0, maxDistance]}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area
                        dataKey="distance"
                        type="monotone"
                        fill="var(--color-distance)"
                        fillOpacity={0.4}
                        stroke="var(--color-distance)"
                    />
                    <Area
                        dataKey="reference"
                        type="monotone"
                        fill="var(--color-reference)"
                        fillOpacity={0.1}
                        stroke="var(--color-reference)"
                        strokeDasharray="5 5"
                    />
                </AreaChart>
            </ChartContainer>
        </ResponsiveContainer>
    )
}

interface RunControlsProps {
    isRunning: boolean;
    onStart: () => void;
    onStop: () => void;
    speed: number;
    onSpeedChange: (change: number) => void;
    referenceSpeed: number;
    onReferenceSpeedChange: (speed: number) => void;
}

const RunControls: React.FC<RunControlsProps> = ({ 
    isRunning, onStart, onStop, speed, onSpeedChange, referenceSpeed, onReferenceSpeedChange 
}) => {
    return (
        <div className="flex flex-col items-center justify-between mt-4 gap-4">
            <Button onClick={isRunning ? onStop : onStart} size="lg" className="w-full text-xl px-4 py-2">
                {isRunning ? <Pause className="h-6 w-6 mr-2" /> : <Play className="h-6 w-6 mr-2" />}
                {isRunning ? 'Stop' : 'Start'}
            </Button>
            <div className="flex items-center justify-center w-full gap-4">
                <Button onClick={() => onSpeedChange(-0.1)} size="lg" className="text-xl px-4 py-2">
                    <Minus className="h-6 w-6" />
                </Button>
                <span className="text-2xl font-bold min-w-[100px] text-center">{speed.toFixed(1)} mi/h</span>
                <Button onClick={() => onSpeedChange(0.1)} size="lg" className="text-xl px-4 py-2">
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
        </div>
    )
}

const ClickChart: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false)
    const [speed, setSpeed] = useState(5.0) // miles per hour
    const [referenceSpeed, setReferenceSpeed] = useState(6.0) // miles per hour
    const [time, setTime] = useState(0)
    const [distance, setDistance] = useState(0)
    const [chartData, setChartData] = useState<ChartDataPoint[]>([{ time: 0, distance: 0, reference: 0 }])
    const [catchUpTime, setCatchUpTime] = useState<number | null>(null)
    const [targetTime, setTargetTime] = useState<number>(3600) // 1 hour in seconds
    const [requiredSpeed, setRequiredSpeed] = useState<number | null>(null)

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined
        if (isRunning) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime + 1)
                setDistance(prevDistance => prevDistance + speed / 3600)
                setChartData(prevData => [
                    ...prevData,
                    { 
                        time: time + 1, 
                        distance: distance + speed / 3600,
                        reference: (time + 1) * referenceSpeed / 3600
                    }
                ])
            }, 1000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning, speed, time, distance, referenceSpeed])

    useEffect(() => {
        if (speed > referenceSpeed) {
            const distanceDiff = chartData[chartData.length - 1].reference - chartData[chartData.length - 1].distance;
            const speedDiff = speed - referenceSpeed;
            const catchUpTimeSeconds = Math.round((distanceDiff / speedDiff) * 3600);
            setCatchUpTime(catchUpTimeSeconds > 0 ? catchUpTimeSeconds : 0);
        } else {
            setCatchUpTime(null);
        }

        const remainingTime = targetTime - time;
        if (remainingTime > 0) {
            const distanceToGo = (referenceSpeed * targetTime / 3600) - distance;
            const requiredSpeedValue = (distanceToGo / remainingTime) * 3600;
            setRequiredSpeed(requiredSpeedValue > 0 ? requiredSpeedValue : null);
        } else {
            setRequiredSpeed(null);
        }
    }, [speed, chartData, referenceSpeed, targetTime, time, distance])

    const handleStart = () => setIsRunning(true)
    const handleStop = () => setIsRunning(false)
    const handleSpeedChange = (change: number) => {
        setSpeed(prevSpeed => Math.max(0, prevSpeed + change))
    }
    const handleReferenceSpeedChange = (change: number) => {
        setReferenceSpeed(prevSpeed => Math.max(0, prevSpeed + change))
    }

    const formatTime = (seconds: number | null): string => {
        if (seconds === null) return "N/A";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    return (
        <div className="w-full h-full flex flex-col">
            <Card className="w-full flex-grow">
                <CardHeader className="flex flex-col items-start justify-between">
                    <div className="mb-4">
                        <CardTitle>Run Chart</CardTitle>
                        <CardDescription>
                            Showing total distance over time
                        </CardDescription>
                    </div>
                    <div className="flex flex-col w-full gap-4">
                        <div className="flex items-center justify-between">
                            <Clock className="h-4 w-4" />
                            <Button onClick={() => setTargetTime(prev => Math.max(60, prev - 60))} size="sm">
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                value={targetTime / 60}
                                onChange={(e) => setTargetTime(parseInt(e.target.value) * 60)}
                                className="w-20 text-center"
                            />
                            <Button onClick={() => setTargetTime(prev => prev + 60)} size="sm">
                                <Plus className="h-4 w-4" />
                            </Button>
                            <span>minutes</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Target className="h-4 w-4" />
                            <Button onClick={() => handleReferenceSpeedChange(-0.1)} size="sm">
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                value={referenceSpeed.toFixed(1)}
                                onChange={(e) => setReferenceSpeed(parseFloat(e.target.value))}
                                className="w-20 text-center"
                            />
                            <Button onClick={() => handleReferenceSpeedChange(0.1)} size="sm">
                                <Plus className="h-4 w-4" />
                            </Button>
                            <span>mi/h</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                    <RunChart data={chartData} maxTime={Math.max(300, time)} />
                </CardContent>
                <CardFooter>
                    <div className="flex flex-col w-full items-start gap-4 text-sm">
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2 font-medium leading-none">
                                Distance: {distance.toFixed(2)} miles <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="flex items-center gap-2 leading-none text-muted-foreground">
                                Time: {formatTime(time)}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2 leading-none text-muted-foreground">
                                Catch up: {formatTime(catchUpTime)}
                            </div>
                            <div className="flex items-center gap-2 leading-none text-muted-foreground">
                                Required speed: {requiredSpeed ? requiredSpeed.toFixed(2) + " mi/h" : "N/A"}
                            </div>
                        </div>
                    </div>
                </CardFooter>
            </Card>
            <RunControls
                isRunning={isRunning}
                onStart={handleStart}
                onStop={handleStop}
                speed={speed}
                onSpeedChange={handleSpeedChange}
                referenceSpeed={referenceSpeed}
                onReferenceSpeedChange={handleReferenceSpeedChange}
            />
        </div>
    )
}

export default ClickChart