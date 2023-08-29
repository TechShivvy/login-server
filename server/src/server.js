//mongodb
require("./config/db");
// require("dotenv").config();
require("dotenv").config({ path: "../env/local.env" });
const app = require("express")();
const cors = require("cors");
const bodyParser = require("express").json;
const routes = require("./routes");

//cors
app.use(cors());

//for accepting post form data
app.use(bodyParser());

//registering routes
app.use(routes);

module.exports = app;
