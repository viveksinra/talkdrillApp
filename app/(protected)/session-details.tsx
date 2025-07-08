import { ReportStatusCard } from '@/components/ReportStatusCard';

// Add this component in the session details screen where appropriate
<ReportStatusCard 
  sessionId={session.id} 
  onReportReady={() => {
    // Navigate to report or refresh session data
    console.log('Report is ready!');
  }}
/> 