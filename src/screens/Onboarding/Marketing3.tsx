import React from "react";
import OnboardSlide from "../../components/OnboardSlide";

export default function Marketing3() {
  return (
    <OnboardSlide
      image={require("../../../assets/images/onboarding/dashboard3.png")}
      title="Track and manage all your progress"
      subtitle="Fast logging, clear trends, fewer distractions."
      cta="Continue"
      nextRoute="ChooseGender"
      showLoginLink
    />
  );
}
