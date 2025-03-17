
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/user";

/**
 * Transform Supabase user to our application User type
 */
export const transformUser = async (supabaseUser: SupabaseUser | null, session: Session | null): Promise<User | null> => {
  if (!supabaseUser) {
    console.log("No supabase user available in transformUser");
    return null;
  }
  
  try {
    console.log("Transforming user:", supabaseUser.id);
    
    // Fetch the user's profile from our profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      
      // Create profile if it doesn't exist (especially important for OAuth users)
      if (error.code === 'PGRST116') { // This is the "no rows returned" error code
        console.log('No profile found for user, creating one...');
        
        // Extract name parts from either user_metadata or raw_user_meta_data
        const metadata = supabaseUser.user_metadata || {};
        const fullName = metadata.full_name || metadata.name || '';
        let firstName = metadata.first_name || '';
        let lastName = metadata.last_name || '';
        
        // If we have a full name but not first/last name, try to split it
        if (fullName && (!firstName || !lastName)) {
          const nameParts = fullName.split(' ');
          firstName = firstName || nameParts[0] || '';
          lastName = lastName || nameParts.slice(1).join(' ') || '';
        }
        
        // Try to get avatar URL
        const avatarUrl = metadata.avatar_url || metadata.picture || '';
        
        // Create a profile for this user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            first_name: firstName,
            last_name: lastName,
            email: supabaseUser.email || '',
            avatar_url: avatarUrl,
          });
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          return null;
        }
        
        // Fetch the newly created profile
        const { data: newProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
          
        if (fetchError || !newProfile) {
          console.error('Error fetching new profile:', fetchError);
          return null;
        }
        
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: `${newProfile.first_name} ${newProfile.last_name}`.trim() || supabaseUser.email || '',
          firstName: newProfile.first_name || '',
          lastName: newProfile.last_name || '',
          avatarUrl: newProfile.avatar_url || avatarUrl,
          role: newProfile.is_admin ? 'admin' : 'user',
          department: newProfile.department || undefined,
          position: newProfile.position || undefined,
        };
      }
      
      return null;
    }
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: `${profile.first_name} ${profile.last_name}`.trim() || supabaseUser.email || '',
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      avatarUrl: profile.avatar_url || supabaseUser.user_metadata?.avatar_url,
      role: profile.is_admin ? 'admin' : 'user',
      department: profile.department || undefined,
      position: profile.position || undefined,
    };
  } catch (error) {
    console.error('Error in transformUser:', error);
    return null;
  }
};

/**
 * Fetch user profile with better error handling
 */
export const fetchProfile = async (userId: string, currentSession: Session | null): Promise<User | null> => {
  try {
    console.log("Fetching profile for user:", userId);
    
    if (!currentSession) {
      console.error('No session available for fetchProfile');
      return null;
    }
    
    return await transformUser(currentSession.user, currentSession);
  } catch (error) {
    console.error('Error in profile flow:', error);
    return null;
  }
};
