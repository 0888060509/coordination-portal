
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Email notifications form
  const { register: registerNotifications, handleSubmit: handleNotificationsSubmit } = useForm({
    defaultValues: {
      emailNotifications: true,
      bookingReminders: true,
      bookingUpdates: true,
      newMessages: false,
      marketingEmails: false
    }
  });
  
  // Security settings form
  const { register: registerSecurity, handleSubmit: handleSecuritySubmit } = useForm();
  
  const onSaveNotifications = async (data: any) => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Settings saved",
      description: "Your notification preferences have been updated."
    });
    
    setIsSaving(false);
  };
  
  const onSaveSecurity = async (data: any) => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully."
    });
    
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure when you'll receive email notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNotificationsSubmit(onSaveNotifications)} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                      <span>Email Notifications</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Receive notifications via email
                      </span>
                    </Label>
                    <Switch 
                      id="emailNotifications" 
                      {...registerNotifications("emailNotifications")}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bookingReminders" className="flex flex-col space-y-1">
                      <span>Booking Reminders</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Get reminded about upcoming bookings
                      </span>
                    </Label>
                    <Switch 
                      id="bookingReminders" 
                      {...registerNotifications("bookingReminders")}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bookingUpdates" className="flex flex-col space-y-1">
                      <span>Booking Updates</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Be notified when a booking is changed or cancelled
                      </span>
                    </Label>
                    <Switch 
                      id="bookingUpdates" 
                      {...registerNotifications("bookingUpdates")}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newMessages" className="flex flex-col space-y-1">
                      <span>New Messages</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Get notified about new messages
                      </span>
                    </Label>
                    <Switch 
                      id="newMessages" 
                      {...registerNotifications("newMessages")}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="marketingEmails" className="flex flex-col space-y-1">
                      <span>Marketing Emails</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Receive emails about new features and special offers
                      </span>
                    </Label>
                    <Switch 
                      id="marketingEmails" 
                      {...registerNotifications("marketingEmails")}
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecuritySubmit(onSaveSecurity)} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...registerSecurity("currentPassword", { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...registerSecurity("newPassword", { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...registerSecurity("confirmPassword", { required: true })}
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Updating..." : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Secure your account with 2FA.
                    </p>
                  </div>
                  <Button variant="outline">Set up</Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-medium">Recovery Codes</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate recovery codes to access your account if you lose your 2FA device.
                    </p>
                  </div>
                  <Button variant="outline" disabled>Generate</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Customize the appearance of the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme Mode</Label>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">Light</Button>
                    <Button variant="outline" className="flex-1">Dark</Button>
                    <Button variant="default" className="flex-1">System</Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">Small</Button>
                    <Button variant="default" className="flex-1">Medium</Button>
                    <Button variant="outline" className="flex-1">Large</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
