import InfoSection from "./infoSection";
import React from "react";
import HeroSection from "./heroSection";

const LandingPage: React.FC = () => {
    return (
        <div>
            <HeroSection />
            <InfoSection />
        </div>
    );
};

export default LandingPage;
