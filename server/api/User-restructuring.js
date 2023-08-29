const express = require("express");
const router = express.Router();

//mongodb user model
const User = require("./../models/User");

//mongodb user verification model
const UserVerification = require("./../models/UserVerification");

//mongodb user verification model
const UserOTPVerification = require("./../models/UserOTPVerification");

//mongodb password reset model
const PasswordReset = require("./../models/PasswordReset");

//email handler
const nodemailer = require("nodemailer");

//unique string
const { v4: uuidv4 } = require("uuid");

//env variables
require("dotenv").config();

//Password Handler
const bcrypt = require("bcrypt");

//path for static verified page
const path = require("path");

const development = "http://localhost:3000/";
const production = "";
const currentUrl = process.env.NODE_ENV ? production : development;




module.exports = router;
