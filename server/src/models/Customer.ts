import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicles: IVehicle[];
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  make: { type: String, required: [true, 'Vehicle make is required'], trim: true },
  model: { type: String, required: [true, 'Vehicle model is required'], trim: true },
  year: { type: Number, required: [true, 'Vehicle manufacturing year is required'] },
  licensePlate: { type: String, required: [true, 'License plate is required'], trim: true, uppercase: true }
});

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: [true, 'Customer name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    address: { type: String, required: [true, 'Customer address is required'] },
    vehicles: [VehicleSchema]
  },
  { timestamps: true }
);

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
