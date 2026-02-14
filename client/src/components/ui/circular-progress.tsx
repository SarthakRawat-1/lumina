
import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
    value: number
    size?: number
    strokeWidth?: number
    color?: string
    label?: string
    sublabel?: string
    className?: string
    text?: string | number
}

export function CircularProgress({
    value,
    size = 120,
    strokeWidth = 10,
    color = "text-violet-500",
    label,
    sublabel,
    className,
    text,
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    return (
        <div className={cn("relative flex flex-col items-center justify-center", className)}>
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background Circle */}
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        className="text-white/5"
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Progress Circle */}
                    <circle
                        className={cn("transition-all duration-1000 ease-out", color)}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-2xl font-bold">{text !== undefined ? text : `${value}%`}</span>
                </div>
            </div>

            {/* Label */}
            {(label || sublabel) && (
                <div className="text-center mt-3">
                    {label && <div className="text-sm font-medium text-white/90">{label}</div>}
                    {sublabel && <div className="text-xs text-white/50">{sublabel}</div>}
                </div>
            )}
        </div>
    )
}
