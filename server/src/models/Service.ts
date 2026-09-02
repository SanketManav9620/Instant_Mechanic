import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  category: string;
  basePrice: number;
  estimatedDurationMins: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: [true, 'Service name is required'], trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true, index: true },
    basePrice: { type: Number, required: [true, 'Base price is required'], min: [0, 'Base price cannot be negative'] },
    estimatedDurationMins: {
      type: Number,
      required: [true, 'Estimated duration is required'],
      min: [5, 'Estimated duration must be at least 5 minutes']
    }
  },
  { timestamps: true }
);

export default mongoose.model<IService>('Service', ServiceSchema);
