const express = require("express");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-route");
const usersRoutes = require("./routes/users-route");
const HttpError = require("./models/http-error");

const app = express();

app.use(express.json());

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({
    message: error.message || "An unknown error occurred!",
  });
});

mongoose
  .connect("mongodb+srv://mern-user:HRSNcgFfu2zK6NQ@cluster0.7qgoz.mongodb.net/places?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
