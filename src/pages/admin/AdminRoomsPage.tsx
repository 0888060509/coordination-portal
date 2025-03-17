
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";

const AdminRoomsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Room Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all meeting rooms in the system
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-meeting-primary hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add New Room
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Room Management</CardTitle>
          <CardDescription>
            View and manage all meeting rooms in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search rooms..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <div className="p-4 text-center">
              <p className="text-muted-foreground">Room management feature is under development</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRoomsPage;
