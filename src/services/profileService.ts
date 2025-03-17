
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/types/index";

/**
 * Fetch profile data for the current authenticated user
 */
export const getProfile = async (): Promise<Profile | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error("No authenticated user found");
      return null;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    return data as Profile;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return null;
  }
};

/**
 * Fetch user profile by user ID
 */
export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    return data as Profile;
  } catch (error) {
    console.error("Unexpected error fetching profile:", error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
    
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated."
    });
    
    return data as Profile;
  } catch (error) {
    console.error("Unexpected error updating profile:", error);
    return null;
  }
};

// Export default for the import in DashboardLayout
export default {
  getProfile,
  fetchUserProfile,
  updateUserProfile
};
