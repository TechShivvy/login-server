import React, { useState } from "react";
import styles from "./../css/Home.module.css";
import Login from "./Login";
import Signup from "./Signup";

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleScreen = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className={styles.body}>
      <section className={styles.section}>
        {[...Array(237)].map((_, index) => (
          <span key={index} className={styles.sectionSpan}></span>
        ))}
        <div
          className={`${styles.signin} ${
            isLogin ? styles.login : styles.signup
          }`}
        >
          <div className={styles.content}>
            <h2>{isLogin ? "Sign In" : "Sign Up"}</h2>
            <div className={styles.form}>
              {isLogin ? (
                <Login toggleScreen={toggleScreen} />
              ) : (
                <Signup toggleScreen={toggleScreen} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
