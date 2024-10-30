import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import DOMPurify from "dompurify";
import * as translationsAPI from "../../utilities/translations-api";
import Accordion from "../Accordion/Accordion.jsx";

export default function Tools({
  dayData,
  englishCitation,
  feedbackHtml,
  setFeedbackHtml,
  paraBibleLink,
  translation,
  officialTranslation,
  setOfficialTranslation,
  activeSections,
  setActiveSections,
}) {
  // Function for toggling accordion sections
  const isActive = (index) => activeSections.includes(index);
  const toggleSection = (index) => {
    setActiveSections((prev) =>
      prev.includes(index)
        ? prev.filter((sectionIndex) => sectionIndex !== index)
        : [...prev, index]
    );
  };

  // Show NET translation and feedback on opening accordion
  useEffect(() => {
    if (isActive("official-translation")) {
      handleShowOfficialTranslations();
    }
    if (isActive("feedback")) {
      handleGetFeedback();
    }
  }, [isActive("official-translation"), isActive("feedback")]);

  // Get official NET translations from Parabible API
  async function handleShowOfficialTranslations() {
    try {
      if (!dayData) return;
      const response = await translationsAPI.getOfficialTranslations(
        englishCitation
      );
      const cleanResponse = DOMPurify.sanitize(response);
      setOfficialTranslation(cleanResponse || "");
    } catch (err) {
      console.log("Error in handleShowOfficialTranslations:", err);
    }
  }

  // Gets feedback on translation from OpenAI
  async function handleGetFeedback() {
    try {
      const payload = [translation, englishCitation];
      const response = await translationsAPI.getTranslationFeedback(payload);
      const cleanResponse = DOMPurify.sanitize(response);
      setFeedbackHtml(cleanResponse || "");
    } catch (err) {
      console.log("Error in handleGetFeedback: ", err);
    }
  }

  return (
    <div>
      <Accordion
        isActive={isActive}
        toggleSection={toggleSection}
        section={"official-translation"}
        content={officialTranslation}
        title={"Show NET Translation"}
      />
      
      <Accordion
        isActive={isActive}
        toggleSection={toggleSection}
        section={"feedback"}
        content={feedbackHtml}
        title={"Show Feedback on Your Translation"}
      />

      <p className="heading paraBibleLink">
        <a href={paraBibleLink} target="_blank" rel="noreferrer">
          <FontAwesomeIcon
            icon={faExternalLinkAlt}
            style={{ marginRight: "10px" }}
          />
          Get Language Help at Parabible{" "}
        </a>
      </p>
    </div>
  );
}