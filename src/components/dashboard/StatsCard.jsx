import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

export function StatsCard({ title, value, description, icon: Icon, trend, className }) {
    return (
        <Card className={cn("", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {trend && (
                            <span className={cn(
                                "mr-1",
                                trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : ""
                            )}>
                                {trend > 0 ? "+" : ""}{trend}%
                            </span>
                        )}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
