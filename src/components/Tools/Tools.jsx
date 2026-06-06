import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExternalLinkAlt,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import DOMPurify from "dompurify";
import * as translationsAPI from "../../utilities/translations-api";
import Accordion from "../Accordion/Accordion.jsx";

export default function Tools({
  dayData,
  englishCitation,
  language,
  feedbackHtml,
  setFeedbackHtml,
  paraBibleLink,
  translation,
  officialTranslation,
  setOfficialTranslation,
  activeSections,
  isActive,
  toggleSection,
}) {
  const infoButton = (
    <>
      <FontAwesomeIcon
        aria-hidden="false"
        icon={faInfoCircle}
        style={{ marginLeft: "10px" }}
        data-tooltip-id="info"
        data-tooltip-html={`Feedback is generated with Anthropic Claude <br />on word choice, grammar, syntax, and fidelity to the Greek/Hebrew.<br />Your translation text is sent only for this request and is not stored for training.`}
        data-tooltip-place="top"
        data-tooltip-wrapper="span"
      />
      <Tooltip id="info" style={{ textAlign: "center" }} />
    </>
  );

  const officialOpen = activeSections.includes("official-translation");
  const feedbackOpen = activeSections.includes("feedback");

  useEffect(() => {
    if (!officialOpen || !dayData) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await translationsAPI.getOfficialTranslations(
          englishCitation
        );
        if (!cancelled) {
          setOfficialTranslation(DOMPurify.sanitize(response) || "");
        }
      } catch (err) {
        console.error("handleShowOfficialTranslations:", err);
        if (!cancelled) {
          setOfficialTranslation(
            `<p class="tool-error">Could not load the NET text for this passage. You can still use the Parabible link below.</p>`
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officialOpen, englishCitation, dayData, setOfficialTranslation]);

  useEffect(() => {
    if (!feedbackOpen) return;
    let cancelled = false;
    (async () => {
      try {
        setFeedbackHtml(`<p>Analyzing your translation…</p>`);
        const payload = {
          translation,
          citation: englishCitation,
          originalText: dayData?.text || "",
          sourceLanguage: language,
        };
        const response = await translationsAPI.getTranslationFeedback(payload);
        if (!cancelled) {
          setFeedbackHtml(DOMPurify.sanitize(response) || "");
        }
      } catch (err) {
        console.error("handleGetFeedback:", err);
        if (!cancelled) {
          const msg = err.message || "Something went wrong.";
          setFeedbackHtml(
            `<p class="tool-error">${DOMPurify.sanitize(msg)}</p>`
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    feedbackOpen,
    translation,
    englishCitation,
    language,
    dayData,
    setFeedbackHtml,
  ]);

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
        infoButton={infoButton}
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
