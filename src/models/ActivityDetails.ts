// import mongoose, { Schema, Document } from "mongoose";

// export interface IActivityDetail extends Document {
//   activityId: mongoose.Types.ObjectId;
//   highlights: string[];
//   inclusions: string[];
//   childAdultPolicy: {
//     freeHeight: number;
//     maxAgeForChildTicket: number;
//   };
//   exclusions: string[];
//   openingHours: {
//     weekdays: string;
//     weekends: string;
//     closedDays: string;
//     specialEventDates: string[];
//   };
//   thingsToKnow: string[];
//   location: {
//     address: string;
//     directionLink: string;
//   };
//   howToGetThere: string[];
//   howToRedeem: string[];
//   cancellationPolicy: string[];
// }

// const ActivityDetailSchema = new Schema({
//   activityId: { 
//     type: Schema.Types.ObjectId, 
//     ref: "Activity", 
//     required: true
//   },
//   highlights: [{ type: String }],
//   inclusions: [{ type: String }],
//   childAdultPolicy: {
//     freeHeight: { type: Number },
//     maxAgeForChildTicket: { type: Number }
//   },
//   exclusions: [{ type: String }],
//   openingHours: {
//     weekdays: { type: String },
//     weekends: { type: String },
//     closedDays: { type: String },
//     specialEventDates: [{ type: String }]
//   },
//   thingsToKnow: [{ type: String }],
//   location: {
//     address: { type: String },
//     directionLink: { type: String }
//   },
//   howToGetThere: [{ type: String }],
//   howToRedeem: [{ type: String }],
//   cancellationPolicy: [{ type: String }],

// });

// export const ActivityDetail = mongoose.model<IActivityDetail>("ActivityDetail", ActivityDetailSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IActivityDetail extends Document {
  activityId: mongoose.Types.ObjectId;
  highlights: string[];
  inclusions: string;
  childAdultPolicy: {
    freeHeight: number;
    maxAgeForChildTicket: number;
  };
  childPolicy: string;
  pickAndDrop: string;
  notSuitableFor: string;
  attireGuidelines: string;
  exclusions: string[];
  openingHours: {
    weekdays: string;
    weekends: string;
    closedDays: string;
    specialEventDates: string[];
  };
  thingsToKnow: string[];
  location: {
    address: string;
    directionLink: string;
  };
  howToGetThere: string[];
  howToRedeem: string[];
  cancellationPolicy: string[];
}

const ActivityDetailSchema = new Schema({
  activityId: { 
    type: Schema.Types.ObjectId, 
    ref: "Activity", 
    required: true
  },
  highlights: [{ type: String }],
  inclusions: { type: String },
  childAdultPolicy: {
    freeHeight: { type: Number },
    maxAgeForChildTicket: { type: Number }
  },
  childPolicy: { type: String },
  pickAndDrop: { type: String },
  notSuitableFor: { type: String },
  attireGuidelines: { type: String },
  exclusions: [{ type: String }],
  openingHours: {
    weekdays: { type: String },
    weekends: { type: String },
    closedDays: { type: String },
    specialEventDates: [{ type: String }]
  },
  thingsToKnow: [{ type: String }],
  location: {
    address: { type: String },
    directionLink: { type: String }
  },
  howToGetThere: [{ type: String }],
  howToRedeem: [{ type: String }],
  cancellationPolicy: [{ type: String }],

});

export const ActivityDetail = mongoose.model<IActivityDetail>("ActivityDetail", ActivityDetailSchema);