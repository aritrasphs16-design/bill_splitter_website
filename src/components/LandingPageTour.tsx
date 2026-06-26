"use client";

import { useState, useEffect } from "react";
import { Joyride, STATUS, Step } from "react-joyride";

export default function LandingPageTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if the user has already completed the landing page tour
    const hasCompletedTour = localStorage.getItem("cruise_landing_tour_completed");
    if (!hasCompletedTour) {
      // Small delay to ensure the DOM is fully rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div className="text-left space-y-3">
          <h2 className="text-xl font-bold text-[#00668c]">Welcome to CruiseSplit! 🚢</h2>
          <p className="text-[#49454f]">Let us give you a quick tour of what this app can do for your next trip.</p>
        </div>
      ),
      placement: "center",
    },
    {
      target: "#tour-hero",
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-[#A33D14]">Split without the headache 📊</h3>
          <p className="text-[#49454f] text-sm">CruiseSplit tracks who paid what and handles all the complex math for you.</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "#tour-features",
      content: (
        <div className="text-left space-y-3">
          <h3 className="font-bold text-[#00668c]">Powerful Features 👥</h3>
          <p className="text-[#49454f] text-sm">We support custom exact splits, multi-currency conversions, and live interactive dashboards.</p>
          <div className="bg-[#E2EFF6] p-3 rounded-lg border border-[#00668c]/20">
            <p className="text-xs font-semibold text-[#00668c]">⚠️ CRITICAL REQUIREMENT:</p>
            <p className="text-xs text-[#00668c]">To add your friends to a group, they <strong>MUST</strong> sign up for their own CruiseSplit account first!</p>
          </div>
        </div>
      ),
      placement: "top",
    },
    {
      target: "#tour-cta",
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-[#A33D14]">Ready to set sail? ⚓</h3>
          <p className="text-[#49454f] text-sm">Sign up for free and start logging your expenses today!</p>
        </div>
      ),
      placement: "top",
    }
  ];

  const handleJoyrideCallback = (data: { status: string }) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("cruise_landing_tour_completed", "true");
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      locale={{ last: 'Finish' }}
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#00668c",
          backgroundColor: "#FFF9F2",
          arrowColor: "#FFF9F2",
          textColor: "#1d1b20",
        },
        buttonNext: {
          backgroundColor: "#00668c",
          borderRadius: "8px",
          padding: "8px 16px",
          fontFamily: "inherit",
          fontWeight: 600,
        },
        buttonBack: {
          color: "#49454f",
          fontFamily: "inherit",
        },
        buttonSkip: {
          color: "#A33D14",
          fontFamily: "inherit",
          fontWeight: 500,
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltip: {
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        }
      }}
    />
  );
}
