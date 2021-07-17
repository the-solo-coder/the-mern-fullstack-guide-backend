const express = require("express");

const placesRoutes = require("./routes/places-route");

const app = express();

app.use("/api/places", placesRoutes);

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({
    message: error.message || "An unknown error occurred!",
  });
});

app.use(express.urlencoded({ extended: true }));

app.listen(5000);
