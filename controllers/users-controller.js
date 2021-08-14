const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

  let token;

  try {
    //up to me to choose which data should be encoded
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      "supersecret_dont_share",
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("Creating user failed, please try again.", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
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

  if (!user) {
    return next(
      new HttpError(`Could not validate user, or password is wrong!`, 403)
    );
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (err) {
    const error = new HttpError(
      "Could not validate user, please try again",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    return next(
      new HttpError(`Could not validate user, or password is wrong!`, 403)
    );
  }

  let token;

  try {
    //up to me to choose which data should be encoded
    token = jwt.sign(
      { userId: user.id, email: user.email },
      "supersecret_dont_share",
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("Login user failed, please try again.", 500);
    return next(error);
  }

  res.json({
    userId: user.id,
    email: user.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
