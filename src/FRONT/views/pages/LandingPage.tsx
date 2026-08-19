import InfoSection from "../components/infoSection";
import React from "react";
import HeroSection from "../components/heroSection";

const LandingPage: React.FC = () => {
    return (
        <div>
            <HeroSection />
            <InfoSection />
        </div>
    );
};

export default LandingPage;
