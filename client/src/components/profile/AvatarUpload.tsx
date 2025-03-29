import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Upload, X } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  displayName: string;
  onSuccess: (newAvatarUrl: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  displayName,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Open file dialog
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Cancel upload
  const handleCancelUpload = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Upload avatar to server
  const handleUpload = async () => {
    if (!previewUrl || !fileInputRef.current?.files?.[0]) return;
    
    // Create form data
    const formData = new FormData();
    formData.append('avatar', fileInputRef.current.files[0]);
    
    setIsUploading(true);
    
    try {
      // Upload avatar
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }
      
      const data = await response.json();
      
      // Call success callback with new avatar URL
      onSuccess(data.avatarUrl);
      
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully',
      });
      
      // Reset state
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Avatar display */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {previewUrl ? (
            <img 
              className="w-full h-full object-cover"
              src={previewUrl}
              alt="Avatar preview"
            />
          ) : currentAvatarUrl ? (
            <img 
              className="w-full h-full object-cover"
              src={currentAvatarUrl}
              alt={displayName}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
              <span className="text-2xl font-semibold">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        
        {/* Edit button */}
        <Button 
          variant="outline"
          size="icon"
          className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-700"
          onClick={handleOpenFileDialog}
          disabled={isUploading}
        >
          <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </Button>
      </div>
      
      {/* Upload controls */}
      {previewUrl && (
        <div className="mt-3 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelUpload}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-1 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                Uploading...
              </span>
            ) : (
              <span className="flex items-center">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};