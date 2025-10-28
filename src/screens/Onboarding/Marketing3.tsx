import React from "react";
import OnboardSlide from "../../components/OnboardSlide";

export default function Marketing3() {
  return (
    <OnboardSlide
      image={require("../../../assets/images/onboarding/dashboard3.png")}
      title="Track and manage all your progress"
      cta="Continue"
      nextRoute="First"
      showLoginLink
    />
  );
}
