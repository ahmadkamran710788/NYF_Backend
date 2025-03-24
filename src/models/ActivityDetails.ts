
import mongoose, { Schema, Document } from "mongoose";

export interface IActivityDetail extends Document {
  activityId: mongoose.Types.ObjectId;
  
  itinerary: string[];
  policy: {
    cancellation: string;
    ageRestriction: string;
  };
  additionalInfo: string[];
  faq: Array<{ question: string; answer: string }>;
}

const ActivityDetailSchema = new Schema({
  activityId: { 
    type: Schema.Types.ObjectId, 
    ref: "Activity", 
    required: true,
    unique: true 
  },
  
  itinerary: [{ type: String }],
  policy: {
    cancellation: { type: String },
    ageRestriction: { type: String }
  },
  additionalInfo: [{ type: String }],
  faq: [{
    question: { type: String },
    answer: { type: String }
  }]
});

export const ActivityDetail = mongoose.model<IActivityDetail>("ActivityDetail", ActivityDetailSchema);