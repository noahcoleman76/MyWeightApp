import React from "react";
import OnboardSlide from "../../components/OnboardSlide";

export default function Marketing2() {
  return (
    <OnboardSlide
      image={require("../../../assets/images/onboarding/dashboard2.png")}
      title="Easily view your journey"
      subtitle="Daily targets adapt as you log."
      cta="Continue"
      nextRoute="Marketing3"
      showLoginLink
    />
  );
}
