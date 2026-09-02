import mongoose, { Schema, Document } from 'mongoose';

export type BookingStatus =
  | 'Pending'
  | 'Assigned'
  | 'Mechanic On The Way'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export interface IStatusHistory {
  status: BookingStatus;
  timestamp: Date;
  note?: string;
}

export interface IBooking extends Document {
  bookingId: string;
  customer: mongoose.Types.ObjectId;
  vehicle: {
    make: string;
    model: string;
    licensePlate: string;
  };
  service: mongoose.Types.ObjectId;
  mechanic?: mongoose.Types.ObjectId | null;
  status: BookingStatus;
  amount: number;
  scheduledAt: Date;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistory>({
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Mechanic On The Way', 'In Progress', 'Completed', 'Cancelled'],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' }
});

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      required: [true, 'Booking ID is required'],
      unique: true,
      trim: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true
    },
    vehicle: {
      make: { type: String, required: [true, 'Vehicle make is required'], trim: true },
      model: { type: String, required: [true, 'Vehicle model is required'], trim: true },
      licensePlate: { type: String, required: [true, 'License plate is required'], trim: true, uppercase: true }
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service reference is required'],
      index: true
    },
    mechanic: {
      type: Schema.Types.ObjectId,
      ref: 'Mechanic',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Assigned', 'Mechanic On The Way', 'In Progress', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid booking status'
      },
      default: 'Pending',
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Booking amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    scheduledAt: { type: Date, default: Date.now, index: true },
    statusHistory: [StatusHistorySchema]
  },
  { timestamps: true }
);

// Text Index to enable fast full-text search across booking ID and vehicle license plate
BookingSchema.index(
  { bookingId: 'text', 'vehicle.licensePlate': 'text' },
  { weights: { bookingId: 10, 'vehicle.licensePlate': 5 }, name: 'booking_search_text_index' }
);

// Compound Index for efficient filtered status listing sorted by date
BookingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);
