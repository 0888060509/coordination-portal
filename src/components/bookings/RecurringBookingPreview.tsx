
import React from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface RecurringInstance {
  date: Date;
  available: boolean;
  conflictId?: string;
  excluded: boolean;
}

interface RecurringBookingPreviewProps {
  instances: RecurringInstance[];
  onExcludeInstance: (date: Date) => void;
  onIncludeInstance: (date: Date) => void;
  recurrenceDescription: string;
}

const RecurringBookingPreview: React.FC<RecurringBookingPreviewProps> = ({
  instances,
  onExcludeInstance,
  onIncludeInstance,
  recurrenceDescription,
}) => {
  const availableCount = instances.filter(i => i.available && !i.excluded).length;
  const conflictCount = instances.filter(i => !i.available).length;
  const excludedCount = instances.filter(i => i.excluded).length;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recurring Booking Preview</CardTitle>
        <CardDescription>
          {recurrenceDescription}
        </CardDescription>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            {availableCount} Available
          </Badge>
          {conflictCount > 0 && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              {conflictCount} Conflicts
            </Badge>
          )}
          {excludedCount > 0 && (
            <Badge variant="secondary">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {excludedCount} Excluded
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-60 rounded-md border">
          <div className="p-4 space-y-2">
            {instances.map((instance, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  {instance.available ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  )}
                  <span>{format(instance.date, "EEEE, MMMM d, yyyy")}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {format(instance.date, "h:mm a")}
                  </span>
                </div>
                
                <div>
                  {instance.excluded ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onIncludeInstance(instance.date)}
                    >
                      Include
                    </Button>
                  ) : instance.available ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onExcludeInstance(instance.date)}
                    >
                      Exclude
                    </Button>
                  ) : (
                    <Badge variant="destructive">Conflict</Badge>
                  )}
                </div>
              </div>
            ))}
            
            {instances.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recurring instances to display
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecurringBookingPreview;
