"use client";

import { useState, useEffect } from "react";
import { Joyride, STATUS, Step } from "react-joyride";

export default function LandingPageTour() {
  const [run, setRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if the user has already seen the tour
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    
    if (!hasSeenTour) {
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
          <h2 className="text-xl font-bold text-primary">Welcome to SplitEasy! 💸</h2>
          <p className="text-[#49454f]">Let us give you a quick tour of what this app can do for your next trip or shared apartment.</p>
        </div>
      ),
      placement: "center",
    },
    {
      target: "#tour-hero",
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-primary">Split without the headache 📊</h3>
          <p className="text-[#49454f] text-sm">SplitEasy tracks who paid what and handles all the complex math for you instantly.</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "#tour-features",
      content: (
        <div className="text-left space-y-3">
          <h3 className="font-bold text-primary">Powerful Features 👥</h3>
          <p className="text-[#49454f] text-sm">We support custom exact splits, multi-currency conversions, and live interactive dashboards.</p>
        </div>
      ),
      placement: "top",
    },
    {
      target: "#tour-cta",
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-primary">Ready to get started? 🚀</h3>
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
      localStorage.setItem("hasSeenTour", "true");
    }
  };

  if (!isMounted) return null;

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      steps={steps}
    />
  );
}
