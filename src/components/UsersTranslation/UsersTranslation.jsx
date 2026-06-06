import { useEffect, useRef } from "react";
import * as translationsAPI from "../../utilities/translations-api";
import "./UsersTranslation.css";

export default function UsersTranslation({
  currentDay,
  language,
  languageIsHebrew,
  translation,
  setTranslation,
  handleSubmit,
  setOfficialTranslation,
}) {

  // /* USE EFFECTS */
  const textareaRef = useRef(null);

  // When day changes, either load any existing translations or clear the form
  useEffect(() => {
    let cancelled = false;
    translationsAPI
      .getDayTranslations(currentDay)
      .then((translations) => {
        if (cancelled) return;
        if (translations && translations[language])
          setTranslation(translations[language]);
        else setTranslation("");
        setOfficialTranslation("");
      })
      .catch((err) => {
        console.error("Error loading day translations:", err);
        if (!cancelled) setTranslation("");
      });
    return () => {
      cancelled = true;
    };
  }, [language, currentDay, languageIsHebrew, setTranslation, setOfficialTranslation]);

  /* HANDLE FUNCTIONS */
  // Adjusts the height of the textarea to match the text
  function handleInput() {
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }

  return (
    <div className="form-container">
      <form autoComplete="off" onSubmit={handleSubmit}>
        <label className="heading" htmlFor="translation">
          Your Translation
        </label>
        <textarea
          name="translation"
          id="translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          ref={textareaRef}
          onInput={handleInput}
          rows={1}
          style={{ overflow: "hidden", resize: "none" }}
          placeholder="Enter your translation here..."
        />
        <div>
          <button type="submit" id="save">
            Save My Translation
          </button>
        </div>
      </form>
    </div>
  );
}
