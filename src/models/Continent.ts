import mongoose, { Schema, Document } from "mongoose";
interface IContinent extends Document {
  name: string;
  description?: string;
  image?: string;
  countries: mongoose.Types.ObjectId[];
}

const ContinentSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
  countries: [{ type: Schema.Types.ObjectId, ref: "Country" }],
});

export const Continent = mongoose.model<IContinent>(
  "Continent",
  ContinentSchema
);

