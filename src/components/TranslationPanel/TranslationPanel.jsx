import { useState, useEffect } from "react";
import * as days from "../../days.json";
import DayInfo from "../DayInfo/DayInfo.jsx";
import VersePanel from "../VersePanel/VersePanel.jsx";
import UsersTranslation from "../UsersTranslation/UsersTranslation.jsx";
import Tools from "../Tools/Tools.jsx";
import DoneForDay from "../../components/DoneForDay/DoneForDay";
import Footer from "../Footer/Footer.jsx";

export default function TranslationPanel({
  user,
  currentDay,
  setCurrentDay,
  maxDate,
  saveTranslation,
  translation,
  setTranslation,
  languageIsHebrew,
  setLanguageIsHebrew
}) {
  /* STATES AND VARIABLES */
  const [feedbackHtml, setFeedbackHtml] = useState("");
  const [done, setDone] = useState(false);
  const [activeSections, setActiveSections] = useState([]);
  const [officialTranslation, setOfficialTranslation] = useState("");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [user, currentDay]);

  useEffect(() => {
    setActiveSections([]);
  }, [currentDay]);

  const dayData = languageIsHebrew ? days[currentDay].OT : days[currentDay].NT; // Return verse info for the current day and language
  const numOfDays = Object.keys(days).filter((key) => key !== "default").length;
  const englishCitation = dayData.citation.english;
  let hebrewCitation = "";
  if (languageIsHebrew) hebrewCitation = dayData.citation.hebrew;
  const language = languageIsHebrew ? "hebrew" : "greek";
  const paraBibleLink = `https://parabible.com/${
    languageIsHebrew ? hebrewCitation : englishCitation
  }`;

  /* HANDLE FUNCTIONS */
  const isActive = (index) => activeSections.includes(index);
  const toggleSection = (index) => {
    setActiveSections((prev) =>
      prev.includes(index)
        ? prev.filter((sectionIndex) => sectionIndex !== index)
        : [...prev, index]
    );
  };

  // Used for "Save Translation" button
  async function handleSubmit(evt) {
    evt.preventDefault();
    const results = await saveTranslation();
    if (results[language]) setTranslation(results[language]);
    else setTranslation("");
  }

  // Moves current day up or down and resets to Hebrew
  async function handleDayChange(num) {
    if ((num === 1 && currentDay < numOfDays) || 
        (num === -1 && currentDay > 1)) {
      saveTranslation();
      setCurrentDay(currentDay + num);
      setLanguageIsHebrew(true);
      setFeedbackHtml("");
      setActiveSections([]);
    }
  }
  
  return (
    <div id="home">
      {done ? (
        <DoneForDay />
      ) : (
        <>
          <DayInfo
            numOfDays={numOfDays}
            maxDate={maxDate}
            currentDay={currentDay}
            handleDayChange={handleDayChange}
            languageIsHebrew={languageIsHebrew}
            setLanguageIsHebrew={setLanguageIsHebrew}
            setDone={setDone}
            handleSubmit={handleSubmit}
            setFeedbackHtml={setFeedbackHtml}
            setActiveSections={setActiveSections}
          />
          <div>
            <div>
              <VersePanel
                language={language}
                dayData={dayData}
                languageIsHebrew={languageIsHebrew}
                hebrewCitation={hebrewCitation}
                englishCitation={englishCitation}
              />

              <UsersTranslation
                user={user}
                currentDay={currentDay}
                language={language}
                languageIsHebrew={languageIsHebrew}
                translation={translation}
                setTranslation={setTranslation}
                setOfficialTranslation={setOfficialTranslation}
                handleSubmit={handleSubmit}
              />

              <Tools
                dayData={dayData}
                englishCitation={englishCitation}
                language={language}
                officialTranslation={officialTranslation}
                setOfficialTranslation={setOfficialTranslation}
                translation={translation}
                feedbackHtml={feedbackHtml}
                setFeedbackHtml={setFeedbackHtml}
                paraBibleLink={paraBibleLink}
                activeSections={activeSections}
                toggleSection={toggleSection}
                isActive={isActive}
              />
            </div>
          </div>
          <Footer user={user} />
        </>
      )}
    </div>
  );
}
