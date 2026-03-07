const mongoose = require("mongoose");

const connectMongo = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(uri, {
    autoIndex: true
  });
};

module.exports = { connectMongo };
