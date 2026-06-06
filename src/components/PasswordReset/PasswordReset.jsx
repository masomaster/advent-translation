import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function PasswordReset({ setError, setEmailEntered, setPwReset }) {
  const [email, setEmail] = useState("");

  async function handlePasswordReset(e) {
    e.preventDefault();
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      setError("Password reset email sent! Please check your inbox.");
      setEmailEntered(false)
      setPwReset(false);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      setError("Failed to send password reset email. Please try again.");
    }
  };

  return (
    <div>
      <form onSubmit={handlePasswordReset}>
        <label htmlFor="email" className="text-input">
        <input
          type="email"
          id="email"
          placeholder="Enter your email address"
          className="input-field email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="sign-in-btn">Reset</button>
        </label>
      </form>
    </div>
  );
}
