import { useState, useEffect } from "react";
import { onAuthChange, listenForUserData } from "../../utilities/firebase";
import * as translationsAPI from "../../utilities/translations-api";
import NavBar from "../../components/NavBar/NavBar";
import TranslationPanel from "../../components/TranslationPanel/TranslationPanel";
import HomePage from "../HomePage/HomePage";
import AuthPage from "../AuthPage/AuthPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [maxDate, setMaxDate] = useState(returnInitialMaxDate());
  const [currentDay, setCurrentDay] = useState(maxDate);
  const [loading, setLoading] = useState(true);
  const [translation, setTranslation] = useState("");
  const [languageIsHebrew, setLanguageIsHebrew] = useState(true);
  const language = languageIsHebrew ? "hebrew" : "greek";
  const [authPage, setAuthPage] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser || null);
      setLoading(false);
      if (firebaseUser) {
        try {
          const data = await listenForUserData();
          if (data) {
            setUser((user) => ({ ...user, ...data }));
          }
        } catch (error) {
          console.error("Error in fetchUserData:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch additional user data (e.g. name) from Firestore, add to user object
  useEffect(() => {
    async function fetchUserData() {
      try {
        const data = await listenForUserData();
        if (data) {
          setUser((user) => ({ ...user, ...data }));
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
      }
    }
    fetchUserData();
  }, []);

  function returnInitialMaxDate() {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const isDecember = now.getMonth() === 11;

    // During December, unlock through today's calendar day (capped at 25).
    if (isDecember) {
      return Math.min(dayOfMonth, 25);
    }
    // Outside December, all days stay available for practice and review.
    return 25;
  }

  async function saveTranslation() {
    try {
      const dayTranslation = {
        [language]: translation,
        day: currentDay,
        firebaseUID: user.uid,
      };
      const results = await translationsAPI.createTranslations(dayTranslation);
      return results;
    } catch (err) {
      console.log("Error in saveTranslation: ", err);
      return null;
    }
  }

  return (
    <main className="App">
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div className="logged-in">
          <NavBar
            user={user}
            currentDay={currentDay}
            setCurrentDay={setCurrentDay}
            maxDate={maxDate}
            saveTranslation={saveTranslation}
            setLanguageIsHebrew={setLanguageIsHebrew}
          />
          <TranslationPanel
            user={user}
            currentDay={currentDay}
            setCurrentDay={setCurrentDay}
            maxDate={maxDate}
            languageIsHebrew={languageIsHebrew}
            setLanguageIsHebrew={setLanguageIsHebrew}
            translation={translation}
            setTranslation={setTranslation}
            saveTranslation={saveTranslation}
          />
        </div>
      ) : authPage ? (
        <AuthPage
        user={user}
          authPage={authPage}
          setAuthPage={setAuthPage}
          setCurrentDay={setCurrentDay}
        />
      ) : (
        <HomePage
          user={user}
          setUser={setUser}
          authPage={authPage}
          setCurrentDay={setCurrentDay}
          setAuthPage={setAuthPage}
        />
      )}
    </main>
  );
}
