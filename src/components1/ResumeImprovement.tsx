import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import Spinner from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { FaCheckCircle, FaLightbulb } from 'react-icons/fa';

interface ResumeImprovementProps {
  resumeFile: File | null;
}

interface ImprovementSuggestion {
  area: string;
  suggestions: string[];
  example: string;
}

export default function ResumeImprovement({ resumeFile }: ResumeImprovementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [customAreas, setCustomAreas] = useState('');
  const { toast } = useToast();

  const roles = [
    'AI/ML Engineer',
    'Frontend Engineer',
    'Backend Engineer',
    'Full Stack Engineer',
    'DevOps Engineer',
    'Data Engineer',
    'Data Scientist',
    'Product Manager',
    'UX Designer',
    'UI Developer',
  ];

  const handleGetImprovements = async () => {
    if (!resumeFile) {
      toast({
        title: 'Error',
        description: 'Please upload a resume first.',
        variant: 'destructive',
      });
      return;
    }

    if (!targetRole && !customAreas.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a target role or specify custom areas for improvement.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setSuggestions([]);

    const formData = new FormData();
    formData.append('resume', resumeFile);
    if (targetRole) {
      formData.append('target_role', targetRole);
    }
    if (customAreas.trim()) {
      formData.append('custom_areas', customAreas);
    }

    try {
      const response = await fetch('http://127.0.0.1:8002/api/improve', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get improvement suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);

      toast({
        title: 'Success',
        description: 'Improvement suggestions generated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get improvement suggestions.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Target Role (Optional)</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Custom Areas for Improvement (Optional)</Label>
              <Textarea
                placeholder="Enter specific areas you want to improve, one per line..."
                value={customAreas}
                onChange={(e) => setCustomAreas(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleGetImprovements}
              disabled={!resumeFile || (!targetRole && !customAreas.trim())}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Generating suggestions...
                </>
              ) : (
                'Get Improvement Suggestions'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {suggestions && suggestions.length > 0 && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Improvement Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Badge variant="secondary" className="text-sm">
                        {suggestion.area}
                      </Badge>
                      
                      <div>
                        <h4 className="font-medium mb-2">Suggestions:</h4>
                        <ul className="space-y-2">
                          {suggestion.suggestions.map((item, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <FaCheckCircle className="text-green-500 mt-1" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {suggestion.example && (
                        <div>
                          <h4 className="font-medium mb-2">Example:</h4>
                          <div className="flex items-start space-x-2">
                            <FaLightbulb className="text-yellow-500 mt-1" />
                            <span>{suggestion.example}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 