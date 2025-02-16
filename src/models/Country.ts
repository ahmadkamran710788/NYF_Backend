import mongoose, { Schema, Document } from "mongoose";
interface ICountry extends Document {
  name: string;
  continent: mongoose.Types.ObjectId;
  description?: string;
  image?: string;
  cities: mongoose.Types.ObjectId[];
}

const CountrySchema = new Schema({
  name: { type: String, required: true },
  continent: { type: Schema.Types.ObjectId, ref: "Continent", required: true },
  description: { type: String },
  image: { type: String },
  cities: [{ type: Schema.Types.ObjectId, ref: "City" }],
});

export const Country = mongoose.model<ICountry>("Country", CountrySchema);
