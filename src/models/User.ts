import mongoose, { Document, Schema } from 'mongoose';

// User interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin"],
      required: true,
      default: "admin"
    },
    
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;