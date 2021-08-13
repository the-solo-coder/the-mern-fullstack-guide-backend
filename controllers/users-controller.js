const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const HttpError = require("../models/http-error");

const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password").exec();
  } catch (err) {
    const error = new HttpError("Couldn't retrieve users!", 500);
    return next(error);
  }

  if (!users || users.length === 0) {
    return next(new HttpError(`Could not find users!`, 404));
  }

  res.json({
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs passed", 422));
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Couldn't retrieve user!", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("User exists already, please login!", 422);
    return next(error);
  }

  let hashedPassword;

  try {
    //12 - salt - how easy/hard it is to solve it
    //looks like an arbitrary number
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create a user, please try again",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Creating user failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let user;
  try {
    user = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Couldn't retrieve user!", 500);
    return next(error);
  }

  if (!user || user.password !== password) {
    return next(
      new HttpError(`Could not validate user, or password is wrong!`, 401)
    );
  }

  res.json({
    message: "User is logged in!",
    user: user.toObject({ getters: true }),
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
