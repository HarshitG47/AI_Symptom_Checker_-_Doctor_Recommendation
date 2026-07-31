const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    profile: {
      age: { type: Number },
      gender: { type: String },
      height: { type: Number }, // in cm
      weight: { type: Number }, // in kg
      bloodGroup: { type: String, default: '' },
      allergies: { type: String, default: '' },
      chronicDiseases: { type: String, default: '' },
      currentMedications: { type: String, default: '' },
      previousSurgeries: { type: String, default: '' },
      familyHistory: { type: String, default: '' },
      lifestyleInfo: { type: String, default: '' },
      smokingStatus: {
        type: String,
        enum: ['smoker', 'non-smoker', ''],
        default: ''
      },
      alcoholStatus: {
        type: String,
        enum: ['non-drinker', 'occasional', 'regular', ''],
        default: ''
      }
    }
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
