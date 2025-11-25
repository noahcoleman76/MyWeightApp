import React from "react";
import OnboardSlide from "../../components/OnboardSlide";

export default function Marketing2() {
  return (
    <OnboardSlide
      image={require("../../../assets/images/onboarding/dashboard2.png")}
      title="Easily visualize your journey"
      cta="Continue"
      nextRoute="Marketing3"
      showLoginLink
      showBackButton={true}
    />
  );
}
