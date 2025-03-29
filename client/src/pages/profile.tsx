import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const { toast } = useToast();
  
  // Fetch user data
  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [showOnMap, setShowOnMap] = useState(true);
  const [maxDistance, setMaxDistance] = useState(2);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  
  // Initialize form with user data when available
  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setShowOnMap(user.showOnMap);
      setMaxDistance(user.maxDistance || 2);
      setInterests(user.interests || []);
    }
  }, [user]);
  
  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      return apiRequest('PATCH', '/api/users/profile', profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProfile.mutate({
      displayName,
      bio,
      showOnMap,
      maxDistance,
      interests,
    });
  };
  
  // Add an interest tag
  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };
  
  // Remove an interest tag
  const removeInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };
  
  // Handle key press in interest input
  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive',
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isError || !user) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load profile. Please try again.
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">My Profile</h2>
      
      <Card className="mb-4">
        <CardContent className="p-6 flex flex-col items-center border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {user.avatarUrl ? (
                <img 
                  className="w-full h-full object-cover"
                  src={user.avatarUrl}
                  alt={user.displayName}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <span className="material-icons text-5xl">person</span>
                </div>
              )}
            </div>
            <Button 
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-700"
              disabled
            >
              <span className="material-icons text-gray-600 dark:text-gray-300 text-lg">edit</span>
            </Button>
          </div>
          <h3 className="mt-4 text-lg font-semibold">{user.displayName}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {user.age} • <span className="material-icons text-xs">location_on</span> {user.location ? 'Location shared' : 'Location not shared'}
          </p>
        </CardContent>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others a bit about yourself"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="interests" className="block mb-2">Interests</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {interests.map((interest, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-3 py-1 rounded-full flex items-center"
                  >
                    {interest}
                    <button 
                      type="button"
                      className="ml-1 hover:text-red-500"
                      onClick={() => removeInterest(index)}
                    >
                      <span className="material-icons text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <Input
                  id="interestInput"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={handleInterestKeyPress}
                  placeholder="Add an interest (e.g., Coffee, Walking)"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="ml-2"
                  onClick={addInterest}
                >
                  Add
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Preferences</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="showOnMap">Show me on map</Label>
                  <Switch
                    id="showOnMap"
                    checked={showOnMap}
                    onCheckedChange={setShowOnMap}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <Label>Maximum distance</Label>
                  <span className="text-primary font-medium">{maxDistance} miles</span>
                </div>
                <Slider
                  value={[maxDistance]}
                  min={0.5}
                  max={10}
                  step={0.5}
                  onValueChange={(values) => setMaxDistance(values[0])}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>0.5 mi</span>
                  <span>10 mi</span>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="justify-between border-t border-gray-200 dark:border-gray-700 p-4">
            <Button type="button" variant="outline" onClick={handleLogout}>
              Logout
            </Button>
            <Button 
              type="submit" 
              className="bg-primary"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Safety & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
          >
            <span className="material-icons mr-2 text-gray-600 dark:text-gray-300">security</span>
            Privacy Settings
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
          >
            <span className="material-icons mr-2 text-gray-600 dark:text-gray-300">help_outline</span>
            Help & Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
