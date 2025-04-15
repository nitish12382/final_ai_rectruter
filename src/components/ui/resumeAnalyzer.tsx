import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Upload, FileText, Settings, Send, Download, CheckCircle2, XCircle, ClipboardCheck, Video } from 'lucide-react';
import { motion } from "framer-motion";
import { useTheme } from '../../context/ThemeContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNavigate, Link } from 'react-router-dom';
import Spinner from "@/components/ui/spinner";

interface ResumeResult {
  names: string[];
  emails: string[];
  similarity: number;
  selected: boolean;
  text: string;
}

interface EmailResult {
  email: string;
  success: boolean;
  message: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

const PREDEFINED_MESSAGES = {
  accept: `Dear Candidate,

We are pleased to inform you that your application has been selected for the position. Your qualifications and experience align well with our requirements.

Next Steps:
1. Please confirm your availability for an interview
2. Prepare any questions you may have about the role
3. We will contact you shortly to schedule the interview

Best regards,
HR Team`,

  reject: `Dear Candidate,

Thank you for your interest in the position. After careful review of your application, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate your time and interest in our company. We encourage you to apply for future positions that match your skills and experience.

Best regards,
HR Team`
};

const ResumeAnalyzer: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [threshold, setThreshold] = useState<number>(50);
  const [results, setResults] = useState<ResumeResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedResumes, setSelectedResumes] = useState<number[]>([]);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const { theme, toggleTheme } = useTheme(); // Updated to include toggleTheme
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Results state updated:', results);
  }, [results]);

  useEffect(() => {
    if (results.length > 0) {
      const selectedIndices = results
        .map((result, index) => result.similarity >= threshold ? index : -1)
        .filter(index => index !== -1);
      setSelectedResumes(selectedIndices);
    }
  }, [threshold, results]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      setResumeFiles(Array.from(e.target.files));
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job description",
        variant: "destructive",
      });
      return;
    }

    if (resumeFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one resume",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('job_description', jobDescription);
      resumeFiles.forEach((file) => {
        formData.append('resume_files', file);
      });
      formData.append('threshold', threshold.toString());

      console.log('Sending request with:', {
        jobDescription: jobDescription.substring(0, 100) + '...',
        numFiles: resumeFiles.length,
        threshold
      });

      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data from backend:', data);
      
      if (data.success) {
        if (!data.results || data.results.length === 0) {
          toast({
            title: "Warning",
            description: "No matching results found. Try adjusting the similarity threshold or job description.",
            variant: "destructive",
          });
          return;
        }
        setResults(data.results);
        const selectedIndices = data.results
          .map((result, index) => result.similarity >= threshold ? index : -1)
          .filter(index => index !== -1);
        setSelectedResumes(selectedIndices);
        toast({
          title: "Success",
          description: "Resumes analyzed successfully!",
        });
      } else {
        throw new Error(data.error || 'Failed to analyze resumes');
      }
    } catch (error) {
      console.error('Error analyzing resumes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze resumes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMessage = async (action: 'accept' | 'reject'): Promise<void> => {
    try {
      if (results.length === 0) {
        toast({
          title: "Error",
          description: "Please analyze resumes first before generating messages.",
          variant: "destructive",
        });
        return;
      }

      try {
        const formData = new FormData();
        formData.append('action', action);
        formData.append('job_description', jobDescription);
        
        const selectedCandidates = selectedResumes.map(index => ({
          name: results[index].names[0] || 'Name not found',
          email: results[index].emails[0] || 'Email not found',
          similarity: results[index].similarity
        }));
        formData.append('candidates', JSON.stringify(selectedCandidates));

        const response = await fetch(`${API_BASE_URL}/generate-message`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setGeneratedMessage(data.generated_message);
          setCustomMessage(data.generated_message);
          toast({
            title: "Success",
            description: `${action === 'accept' ? 'Acceptance' : 'Rejection'} message generated successfully!`,
          });
        } else {
          throw new Error(data.error || 'Failed to generate message');
        }
      } catch (error) {
        console.error('Error generating message:', error);
        toast({
          title: "Error",
          description: "Failed to generate message. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate message",
        variant: "destructive",
      });
    }
  };

  const handleProcessAction = async (action: 'accept' | 'reject'): Promise<void> => {
    if (action === 'accept' && selectedResumes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one resume to accept.",
        variant: "destructive",
      });
      return;
    }

    try {
      let messageToUse = customMessage;
      
      if (!messageToUse) {
        try {
          const messageFormData = new FormData();
          messageFormData.append('action', action);
          
          const messageResponse = await fetch(`${API_BASE_URL}/generate-message`, {
            method: 'POST',
            body: messageFormData,
          });

          if (!messageResponse.ok) {
            throw new Error(`Failed to generate message: ${messageResponse.status}`);
          }

          const messageData = await messageResponse.json();
          if (messageData.success) {
            messageToUse = messageData.generated_message;
          } else {
            throw new Error(messageData.error || 'Failed to generate message');
          }
        } catch (error) {
          messageToUse = PREDEFINED_MESSAGES[action];
        }
      }

      const targetEmails = action === 'accept' 
        ? selectedResumes.map(index => results[index].emails[0]).filter(Boolean)
        : results.filter((_, index) => !selectedResumes.includes(index)).map(result => result.emails[0]).filter(Boolean);

      if (targetEmails.length === 0) {
        toast({
          title: "Error",
          description: "No valid email addresses found for the selected action.",
          variant: "destructive",
        });
        return;
      }

      const emailResponse = await fetch(`${API_BASE_URL}/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          message: messageToUse,
          selected_emails: action === 'accept' ? targetEmails : [],
          rejected_emails: action === 'reject' ? targetEmails : [],
          subject: action === 'accept' 
            ? "Congratulations - Your Application Has Been Selected" 
            : "Application Status Update - Thank You for Your Interest"
        }),
      });

      if (!emailResponse.ok) {
        throw new Error(`Failed to send emails: ${emailResponse.status}`);
      }

      const emailData = await emailResponse.json();
      
      if (emailData.success) {
        const successCount = emailData.results.filter((r: EmailResult) => r.success).length;
        const failCount = emailData.results.filter((r: EmailResult) => !r.success).length;
        
        toast({
          title: "Success",
          description: `Emails sent successfully! (${successCount} successful, ${failCount} failed)`,
        });

        if (failCount > 0) {
          console.error('Failed email sends:', emailData.results.filter((r: EmailResult) => !r.success));
        }
      } else {
        throw new Error(emailData.error || 'Failed to send emails');
      }

      const formData = new FormData();
      formData.append('action', action);
      formData.append('custom_message', messageToUse);
      selectedResumes.forEach(index => {
        formData.append('selected_resume', index.toString());
      });

      const response = await fetch(`${API_BASE_URL}/process-action`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setCustomMessage(messageToUse);
        setGeneratedMessage(messageToUse);
        console.log(data.msg);
      } else {
        throw new Error(data.msg || 'Failed to process action');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process action",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCSV = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/download-csv`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ranked_resumes.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Success",
        description: "CSV file downloaded successfully!",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to download CSV file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 items-center mb-8 gap-4">
          <div className="hidden md:block"></div> {/* Empty spacer for column 1 */}
          <motion.h1 
            className={`col-span-1 md:col-start-2 text-center text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Multi Resume Analyzer
          </motion.h1>
          <Badge 
            variant="outline" 
            className="col-span-1 md:col-start-3 justify-self-center md:justify-self-end cursor-pointer" 
            onClick={toggleTheme}
          >
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className={`${
              theme === 'dark' 
                ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800' 
                : 'bg-white/50 backdrop-blur-sm border-slate-200'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Job Description
                </CardTitle>
                <CardDescription className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  Enter the job requirements and qualifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Enter the job description..."
                  className={`min-h-[200px] ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700 text-white' 
                      : 'bg-white/50 border-slate-200 text-slate-900'
                  }`}
                />
              </CardContent>
            </Card>

            <Card className={`${
              theme === 'dark' 
                ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800' 
                : 'bg-white/50 backdrop-blur-sm border-slate-200'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <Upload className="w-5 h-5 text-cyan-400" />
                  Upload Resumes
                </CardTitle>
                <CardDescription className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  Select multiple PDF resumes to analyze
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    className={`${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white' 
                        : 'bg-white/50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <ScrollArea className="h-[100px] rounded-md border p-4">
                    <div className="space-y-2">
                      {resumeFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                            {file.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            <Card className={`${
              theme === 'dark' 
                ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800' 
                : 'bg-white/50 backdrop-blur-sm border-slate-200'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Similarity Threshold
                </CardTitle>
                <CardDescription className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  Adjust the minimum similarity percentage for candidate selection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Slider
                    value={[threshold]}
                    onValueChange={(value) => setThreshold(value[0])}
                    min={0}
                    max={100}
                    step={1}
                    className={theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}
                  />
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                      Threshold: {threshold}%
                    </span>
                    <Progress value={threshold} className="w-[60%]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleAnalyze}
              disabled={loading || !jobDescription || resumeFiles.length === 0}
              className={`w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Resumes'
              )}
            </Button>
          </motion.div>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {results.length > 0 && (
              <Card className={`${
                theme === 'dark' 
                  ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800' 
                  : 'bg-white/50 backdrop-blur-sm border-slate-200'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`flex items-center gap-2 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <FileText className="w-5 h-5 text-cyan-400" />
                      Analysis Results
                    </CardTitle>
                    <Link to="/hr-resume-analysis">
                      <Button
                        variant="outline"
                        className={`${
                          theme === 'dark'
                            ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950'
                            : 'border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white'
                        }`}
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Single Resume Analysis
                      </Button>
                    </Link>
                  </div>
                  <CardDescription className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                    Review and select candidates based on their match percentage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {results.map((result, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={`p-4 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' 
                              : 'bg-white/50 border-slate-200 hover:bg-slate-50'
                          } transition-colors duration-200`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className={`font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-slate-900'
                              }`}>
                                {result.names[0] || 'Name not found'}
                              </p>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {result.emails[0] || 'Email not found'}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant={result.similarity >= threshold ? "default" : "secondary"}>
                                {result.similarity.toFixed(2)}% Match
                              </Badge>
                              <Checkbox
                                checked={selectedResumes.includes(index)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedResumes([...selectedResumes, index]);
                                  } else {
                                    setSelectedResumes(selectedResumes.filter(i => i !== index));
                                  }
                                }}
                                className={theme === 'dark' ? 'border-slate-600' : 'border-slate-300'}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <Separator className="my-6" />
                <CardFooter className="flex flex-col space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleGenerateMessage('accept')}
                      variant="outline"
                      className={`${
                        theme === 'dark'
                          ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950'
                          : 'border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Generate Acceptance Message
                    </Button>
                    <Button
                      onClick={() => handleGenerateMessage('reject')}
                      variant="outline"
                      className={`${
                        theme === 'dark'
                          ? 'border-red-400 text-red-400 hover:bg-red-400 hover:text-slate-950'
                          : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Generate Rejection Message
                    </Button>
                  </div>

                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Customize the message..."
                    className={`min-h-[200px] ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white' 
                        : 'bg-white/50 border-slate-200 text-slate-900'
                    }`}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleProcessAction('accept')}
                      disabled={selectedResumes.length === 0}
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accept Selected
                    </Button>
                    <Button
                      onClick={() => handleProcessAction('reject')}
                      variant="destructive"
                      className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Others
                    </Button>
                    <Button
                      onClick={() => navigate('/interview/swarup')}
                      className="bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-semibold"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Start Video Interview
                    </Button>
                    <Button
                      onClick={handleDownloadCSV}
                      variant="outline"
                      className={`${
                        theme === 'dark'
                          ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950'
                          : 'border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white'
                      }`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResumeAnalyzer;