const express = require("express");

const placesRoutes = require("./routes/places-route");

const app = express();

app.use(placesRoutes);

app.use(express.urlencoded({ extended: true }));

app.listen(5000);
