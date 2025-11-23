const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String }, // optional for social accounts
    name: { type: String, trim: true },
    providers: {
      googleId: { type: String },
      githubId: { type: String },
      appleId: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);


