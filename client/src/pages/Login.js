import React, { useState } from "react";
import axios from "axios";
import homeStyles from "./../css/Home.module.css";
import Password from "./Password";

const Login = ({ toggleScreen }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/user/signin", {
        email,
        password,
      });

      // Handle success response
      console.log("Login successful:", response.data);
    } catch (error) {
      console.error("Login error:", error);
    }
  };


  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  return (
    <>
      <div className={homeStyles.inputBox}>
        <input
          type="text"
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <i>Email</i>
      </div>
      {/* <div className={homeStyles.inputBox}> */}
        {/* <input
          type={showPassword ? "text" : "password"}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <i>Password</i> */}
        <Password/>
      {/* </div> */}
      <div className={`${homeStyles.links} ${homeStyles["login-links"]}`}>
        <a href="#">Forgot Password</a>
        <a href="#" onClick={toggleScreen}>
          Signup
        </a>
      </div>
      <div className={homeStyles.inputBox}>
        <input type="submit" value="Login" onClick={handleLogin} />
      </div>
    </>
  );
};

export default Login;
