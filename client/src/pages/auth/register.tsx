import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      age: 18,
      bio: '',
      interests: [] as string[]
    }
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    
    try {
      // Remove confirmPassword as it's not part of the schema
      const { confirmPassword, ...userData } = values;
      
      // Convert interests string array to proper format if needed
      const formattedData = {
        ...userData,
        // Ensure age is a number
        age: Number(userData.age)
      };
      
      await apiRequest('POST', '/api/auth/register', formattedData);
      
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to GoSmoke. You are now logged in.',
      });
      
      // Redirect to discover page
      setLocation('/discover');
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Registration Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <span className="text-primary text-3xl font-bold">GoSmoke</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Age (18+)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="25" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || '')}
                          min={18}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Bio (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us a little about yourself..."
                          {...field}
                          value={field.value || ''} // Ensure value is never null
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Interests (comma separated)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="smoking, coffee, walks" 
                          {...field} 
                          value={field.value ? field.value.join(', ') : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            let interests: string[] = [];
                            
                            if (value.trim()) {
                              interests = value.split(',').map(i => i.trim()).filter(Boolean);
                            }
                            
                            field.onChange(interests);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Add interests separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 rounded border-gray-300 text-primary focus:ring-primary" 
                    required
                  />
                  I am at least 18 years old
                </Label>
                
                <Label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 rounded border-gray-300 text-primary focus:ring-primary" 
                    required
                  />
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline ml-1">
                    Terms and Conditions
                  </a>
                </Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : 'Create Account'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
