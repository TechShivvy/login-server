import React, { useState } from "react";
import pwdStyles from "../css/Password.module.css";

const Password = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  return (
    <>
    <div className={pwdStyles.container}>
      <input
            type={passwordVisible ? "text" : "password"}
            // placeholder="Password"
            // id="password"
            // className={pwdStyles.input}
            required
          />
          <i>Password</i> {/* This might need adjustment */}
          <div
            className={pwdStyles.eyeWrapper}
            onClick={togglePasswordVisibility}
            style={{
              boxShadow: passwordVisible
                ? "0 0 0 300px white"
                : "0 0 0 0px white",
            }}
          >
            {passwordVisible ? (
              <svg id={pwdStyles.close} width="25" height="25">
                <g stroke="#7D4262" strokeMiterlimit="10">
                  <path
                    d="M21.632 12.5a9.759 9.759 0 01-18.264 0 9.759 9.759 0 0118.264 0z"
                    fill="none"
                  />
                  <circle cx="12.5" cy="12.5" r="3" fill="#7D4262" />
                  <path
                    fill="none"
                    d="M12.5 5v1-4M9.291 6.337L7.709 2.663M15.709 6.337l1.582-3.674"
                  />
                </g>
              </svg>
            ) : (
              <svg id={pwdStyles.open} width="25" height="25">
                <g fill="none" stroke="#7D4262" strokeMiterlimit="10">
                  <path d="M21.632 12.5a9.759 9.759 0 01-18.264 0M12.5 19.5v-1 4M9.291 18.163l-1.582 3.674M15.709 18.163l1.582 3.674" />
                </g>
              </svg>
            )}
          </div>
          </div>
    </>
  );
};

export default Password;
