import mongoose, { Schema, Document } from 'mongoose';

export type MechanicStatus = 'available' | 'busy' | 'on_the_way' | 'offline';

export interface IMechanic extends Document {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  status: MechanicStatus;
  jobsCompleted: number;
  rating: number;
  currentBooking?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const MechanicSchema = new Schema<IMechanic>(
  {
    name: { type: String, required: [true, 'Mechanic name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Mechanic email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    specialties: {
      type: [{ type: String, trim: true }],
      required: [true, 'At least one specialty is required']
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'busy', 'on_the_way', 'offline'],
        message: '{VALUE} is not a valid mechanic status'
      },
      default: 'available',
      index: true
    },
    jobsCompleted: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 5.0, min: 1.0, max: 5.0 },
    currentBooking: { type: Schema.Types.ObjectId, ref: 'Booking', default: null, index: true }
  },
  { timestamps: true }
);

export default mongoose.model<IMechanic>('Mechanic', MechanicSchema);
