const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./mongoDB/connect.js");
dotenv.config();
const app = express();
app.use(cors());
app.get("/", async (req, res) => {
  res.send("hello world");
});
app.use("/api/v1/auth", require("./routes/auth.js"));
const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URL);
    app.listen(8080, () => {
      console.log("server is started on http://localhost:8080");
    });
  } catch (err) {
    console.log(err);
  }
};
startServer();
