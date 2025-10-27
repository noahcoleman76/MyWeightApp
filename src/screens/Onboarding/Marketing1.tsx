import React from "react";
import OnboardSlide from "../../components/OnboardSlide";

export default function Marketing1() {
  return (
    <OnboardSlide
      image={require("../../../assets/images/onboarding/dashboard1.png")}
      title="Weight tracking made easy"
      cta="Get Started"
      nextRoute="Marketing2"
      showLoginLink
    />
  );
}
