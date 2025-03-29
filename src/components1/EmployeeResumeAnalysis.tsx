import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResumeAnalysis } from './ResumeAnalysis';
import ResumeQA from './ResumeQA';
import InterviewQuestions from './InterviewQuestions';
import SalaryPredictor from '@/components/ui/SalaryPredictor';
import CandidatePredictor from '@/components/ui/CandidatePredictor';
import ImprovedResume from './ImprovedResume';
import ResumeImprovement from './ResumeImprovement';
import '@/styles/scrollbar.css';

interface AnalysisResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  areas_for_improvement: string[];
  years_of_experience: number;
  education_level: string;
  job_level: string;
  industry: string;
  location: string;
  skill_match_score: number;
}

interface ResumeData {
  file: File | null;
  text: string;
  analysis: AnalysisResult | null;
}

export const EmployeeResumeAnalysis: React.FC = () => {
  const [activeSection, setActiveSection] = useState('analysis');
  const [resumeData, setResumeData] = useState<ResumeData>({
    file: null,
    text: '',
    analysis: null
  });
  const [useResumeDataForSalary, setUseResumeDataForSalary] = useState(false);
  const [useResumeDataForJob, setUseResumeDataForJob] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleResumeUpload = (file: File) => {
    setResumeData(prev => ({ ...prev, file }));
  };

  const handleAnalysisComplete = (analysis: AnalysisResult) => {
    setResumeData(prev => ({ ...prev, analysis }));
  };

  // Function to extract data from resume analysis
  const getResumeDataForSalary = () => {
    if (!resumeData.analysis) return null;
    
    try {
      const analysis = resumeData.analysis;
      const years_experience = analysis.years_of_experience;
      const education = analysis.education_level;
      const job_level = analysis.job_level;
      const industry = analysis.industry;
      const location = analysis.location;

      // Validate required numeric fields
      if (typeof years_experience !== 'number' || isNaN(years_experience)) {
        throw new Error('Invalid years of experience in resume analysis');
      }

      return {
        years_experience: years_experience.toString(),
        education: education || 'Bachelor',
        job_level: job_level || 'Mid-level',
        industry: industry || 'Technology',
        location: location || 'Urban'
      };
    } catch (error) {
      console.error('Error extracting salary data from resume:', error);
      return null;
    }
  };

  const getResumeDataForJob = () => {
    if (!resumeData.analysis) return null;
    
    try {
      const analysis = resumeData.analysis;
      const years_experience = analysis.years_of_experience;
      const skill_match_score = analysis.skill_match_score;
      const education = analysis.education_level;
      const job_level = analysis.job_level;
      const industry = analysis.industry;

      // Validate required numeric fields
      if (typeof years_experience !== 'number' || isNaN(years_experience)) {
        throw new Error('Invalid years of experience in resume analysis');
      }
      if (typeof skill_match_score !== 'number' || isNaN(skill_match_score) || skill_match_score < 0 || skill_match_score > 1) {
        throw new Error('Invalid skill match score in resume analysis');
      }

      return {
        years_experience: years_experience.toString(),
        skill_match_score: skill_match_score.toString(),
        education: education || 'Bachelor',
        job_level: job_level || 'Mid-level',
        industry: industry || 'Technology'
      };
    } catch (error) {
      console.error('Error extracting job data from resume:', error);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white font-sans">
              Get deep insights about your resume
            </h2>
            <div className="space-y-4">
              <p className="text-white text-4xl font-semibold">
                Do use our Job Possibility predictor and Salary Predictor !!
              </p>
              <p className="text-red-500 font-bold text-lg">
                Make sure to add Resume first in Resume Analysis
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="w-1/3 flex items-center">
            {resumeData.file ? (
              <div className="w-full h-[600px] rounded-lg overflow-hidden border border-border">
                <iframe
                  src={URL.createObjectURL(resumeData.file)}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="text-center p-6 rounded-lg border border-dashed border-border">
                <p className="text-lg font-medium text-muted-foreground">
                  Get Resume Preview
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  PDF files only
                </p>
              </div>
            )}
          </div>

          <div className="w-2/3">
            <Tabs defaultValue="analysis" className="w-full">
              <div className="relative">
                <div className="overflow-x-auto custom-scrollbar">
                  <TabsList className="inline-flex min-w-full border-b border-border">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="analysis" className="px-4 py-2">
                            Resume Analysis
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Analyze your resume for skills, experience, and qualifications</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="qa" className="px-4 py-2">
                            Resume Q&A
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ask questions about your resume and get AI-powered answers</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="questions" className="px-4 py-2">
                            Interview Questions
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Get personalized interview questions based on your resume</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="salary" className="px-4 py-2">
                            Salary Predictor
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Predict your potential salary based on your experience and skills</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="candidate" className="px-4 py-2">
                            Job Possibility
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Assess your chances of getting hired for different job roles</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="improved" className="px-4 py-2">
                            Improved Resume
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Get an optimized version of your resume for specific job roles</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="improvement" className="px-4 py-2">
                            Resume Improvement
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Receive detailed suggestions to enhance your resume</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TabsList>
                </div>
              </div>
              <div className="mt-4">
                <TabsContent value="analysis">
                  <ResumeAnalysis
                    onResumeUpload={handleResumeUpload}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                </TabsContent>
                <TabsContent value="qa">
                  <ResumeQA
                    resumeFile={resumeData.file}
                    resumeText={resumeData.text}
                    analysis={resumeData.analysis}
                  />
                </TabsContent>
                <TabsContent value="questions">
                  <InterviewQuestions
                    resumeFile={resumeData.file}
                    resumeText={resumeData.text}
                    analysis={resumeData.analysis}
                  />
                </TabsContent>
                <TabsContent value="salary">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-resume-salary"
                        checked={useResumeDataForSalary}
                        onCheckedChange={(checked) => {
                          const newValue = checked as boolean;
                          setUseResumeDataForSalary(newValue);
                          if (!newValue) {
                            setResumeData(prev => ({ ...prev, analysis: null }));
                          }
                        }}
                      />
                      <Label htmlFor="use-resume-salary" className="text-white">
                        Use data from resume analysis
                      </Label>
                    </div>
                    <SalaryPredictor 
                      initialData={useResumeDataForSalary ? getResumeDataForSalary() : undefined}
                      useResumeData={useResumeDataForSalary}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="candidate">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-resume-job"
                        checked={useResumeDataForJob}
                        onCheckedChange={(checked) => {
                          const newValue = checked as boolean;
                          setUseResumeDataForJob(newValue);
                          if (!newValue) {
                            setResumeData(prev => ({ ...prev, analysis: null }));
                          }
                        }}
                      />
                      <Label htmlFor="use-resume-job" className="text-white">
                        Use data from resume analysis
                      </Label>
                    </div>
                    <CandidatePredictor 
                      initialData={useResumeDataForJob ? getResumeDataForJob() : undefined}
                      useResumeData={useResumeDataForJob}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="improved">
                  <div className="bg-card rounded-lg border border-border p-6">
                    <ImprovedResume resumeFile={resumeData.file} />
                  </div>
                </TabsContent>
                <TabsContent value="improvement">
                  <div className="bg-card rounded-lg border border-border p-6">
                    <ResumeImprovement resumeFile={resumeData.file} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}; 