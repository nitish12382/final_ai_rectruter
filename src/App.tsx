import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ChakraProvider } from '@chakra-ui/react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResumeAnalyzer from "./components/ui/resumeAnalyzer";
import Login from "./components/ui/login";
import { ResumeAnalysisContainer } from "./components1/ResumeAnalysisContainer";
import { ThemeProvider as CustomThemeProvider } from './context/ThemeContext';
import CandidatePredictor from "./components/ui/CandidatePredictor";
import { EmployeeResumeAnalysis } from './components1/EmployeeResumeAnalysis';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChakraProvider>
      <CustomThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/resumeAnalyzer" element={<ResumeAnalyzer />} />
              <Route path="/login" element={<Login />} />
              <Route path="/resume-analysis" element={<ResumeAnalysisContainer />} />
              <Route path="/employee-resume-analysis" element={<EmployeeResumeAnalysis />} />
              <Route path="/candidate-predictor" element={<CandidatePredictor />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </CustomThemeProvider>
    </ChakraProvider>
  </QueryClientProvider>
);

export default App;
