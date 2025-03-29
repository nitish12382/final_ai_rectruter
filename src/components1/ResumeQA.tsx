import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ResumeQAProps {
  resumeFile: File | null;
  resumeText: string;
  analysis: any;
}

const ResumeQA: React.FC<ResumeQAProps> = ({ resumeFile, resumeText, analysis }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please upload a resume in the Resume Analysis section first.');
      return;
    }

    setLoading(true);
    setError('');
    setAnswer([]); // Reset answer before new request

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('question', question);

      const response = await fetch('http://127.0.0.1:8002/api/qa', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      // Ensure we're setting an array
      if (Array.isArray(data.answer)) {
        setAnswer(data.answer);
      } else {
        setAnswer([data.answer]);
      }
    } catch (err) {
      setError('Failed to get answer. Please try again.');
      setAnswer([]); // Reset answer on error
    } finally {
      setLoading(false);
    }
  };

  if (!resumeFile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <Alert variant="info" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please upload a resume in the Resume Analysis section first to use the Q&A feature.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Ask Questions About Your Resume</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Ask a question about your resume..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Getting Answer...' : 'Ask Question'}
            </Button>
          </form>

          {answer && answer.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Answer:</h3>
              <ul className="list-disc pl-4 space-y-2">
                {answer.map((point, index) => (
                  <li key={index} className="text-muted-foreground">
                    {typeof point === 'string' ? point.replace('-', '').trim() : String(point)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeQA; 