import React from 'react';
import Feature from './Feature';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faLanguage, faComments, faBookOpen } from '@fortawesome/free-solid-svg-icons';

function FeatureSection() {
    const features = [
        {
          title: "Hebrew and Greek Help",
          description: "Access parsing information and word definitions through Parabible.",
          icon: <FontAwesomeIcon icon={faLanguage} />,
        },
        {
          title: "Compare Translations",
          description: "View original text and an English translation side by side to catch every nuance.",
          icon: <FontAwesomeIcon icon={faSearch} />,
        },
        {
          title: "Real-Time Feedback",
          description: "Receive structured, language-specific feedback (Claude) on word choice, grammar, syntax, and fidelity to the original.",
          icon: <FontAwesomeIcon icon={faComments} />,
        },
        {
          title: "Personalized Learning",
          description: "Track your progress and dive deeper into the areas that interest you most.",
          icon: <FontAwesomeIcon icon={faBookOpen} />,
        },
      ];

  return (
    <section className="features">
      {features.map((feature, index) => (
        <Feature key={index} title={feature.title} icon={feature.icon} description={feature.description}/>
      ))}
    </section>
  );
}

export default FeatureSection;
