import mongoose, { Schema, Document } from "mongoose";
import { IActivity } from "./Activity";
export interface ICity extends Document {
  name: string;
  country: mongoose.Types.ObjectId;
  description?: string;
  image?: string;
  activities: IActivity[];
}

const CitySchema = new Schema({
  name: { type: String, required: true },
  country: { type: Schema.Types.ObjectId, ref: "Country", required: true },
  description: { type: String },
  image: { type: String },
  activities: [{ type: Schema.Types.ObjectId, ref: "Activity" }],
});

export const City = mongoose.model<ICity>("City", CitySchema);
