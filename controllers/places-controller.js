const { v4: uuidv4 } = require("uuid"); //correct new version compared to the course
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");

const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Couldn't retrieve place!", 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      `Could not find a place with provided place id: ${placeId}`,
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError("Couldn't retrieve places!" + err, 500);
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError(
        `Could not find a places with provided user id: ${userId}`,
        404
      )
    );
  }

  res.json({
    places: userWithPlaces.places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed", 422));
  }

  const { title, description, address, creator } = req.body;

  let coordinates;

  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    image:
      "https://cdn.vox-cdn.com/thumbor/JMqrPS2RmaDK6S5zaMuIw03I5Ns=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/18971698/151006_19_00_22_5DSR9489.jpg",
    location: coordinates,
    address,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Create place failed - please try again!", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("User doesn't exist!", 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });

    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed", 422));
  }

  const { title, description, address } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Couldn't retrieve place!", 500);
    return next(error);
  }

  place.title = title;
  place.description = description;
  place.address = address;

  try {
    const result = await place.save();
  } catch (err) {
    const error = new HttpError(
      "Updating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    console.log(placeId);
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError("Couldn't retrieve place!" + err, 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place!", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });

    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Deleting place failed, please try again." + err,
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
