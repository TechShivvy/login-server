import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignUp from "./pages/Signup";
import Password from "./pages/Password";

function App() {
  return (
    <BrowserRouter>
      {/* <Header /> */}
      <main className="App">
        <Routes>
          <Route path="/" element={<Home />} exact />
          {/* <Route path="/login" element={<Login />} exact />
          <Route path="/signup" element={<SignUp />} exact /> */}
          <Route path="/home" element={<Home />} exact />
          <Route path="/pwd" element={<Password />} exact />
          {/* <Route path="/forgot_password" element={<Warden />} exact />
          <Route path="/reset_password" element={<Student />} exact />
          <Route path="/verify_email" element={<Security />} exact />
          <Route path="/verify_email_otp" element={<Searchresults />} exact />
          <Route path="/apply" element={<Apply />} exact />
          <Route path="/qr" element={<QrCode />} exact />
          <Route path="/qrscan" element={<QrScanner />} exact />
          <Route path="/history" element={<ViewHistory />} exact /> */}
        </Routes>
      </main>
      {/* <Footer /> */}
    </BrowserRouter>
    // <div className="App">
    //   <Login/>
    // </div>
  );
}

export default App;
