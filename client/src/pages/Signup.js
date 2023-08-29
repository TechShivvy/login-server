import React, { useState } from "react";
import axios from "axios";
import homeStyles from "./../css/Home.module.css"; // Import the CSS module

const Signup = ({ toggleScreen }) => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!name || !dob || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await axios.post("YOUR_SIGNUP_ENDPOINT", {
        name,
        dob,
        email,
        password,
      });

      // Handle success response
      console.log("Signup successful:", response.data);
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    <>
      <div className={homeStyles.inputBox}>
        <input type="text" required onChange={(e) => setName(e.target.value)} />
        <i>Name</i>
      </div>
      <div className={homeStyles.inputBox}>
        <input type="date" required onChange={(e) => setDob(e.target.value)} />
        <i>Date of Birth</i>
      </div>
      <div className={homeStyles.inputBox}>
        <input
          type="email"
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <i>Email</i>
      </div>
      <div className={homeStyles.inputBox}>
        <input
          type="password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <i>Password</i>
      </div>
      <div className={`${homeStyles.links} ${homeStyles["signup-links"]}`}>
        <a href="#" onClick={toggleScreen}>
          Already have an account? Sign In
        </a>
      </div>
      <div className={homeStyles.inputBox}>
        <input type="submit" value="Sign Up" onClick={handleSignup} />
      </div>
    </>
  );
};

export default Signup;
