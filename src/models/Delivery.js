const mongoose = require('mongoose');
const { Schema } = mongoose;

const deliverySchema = new Schema(
  {
    shipperId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    travelerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Can be null if not yet assigned
    },
    origin: {
      address: { type: String, required: true },
      coords: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
    },
    destination: {
      address: { type: String, required: true },
      coords: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
    },
    // TODO: Add package details (size, weight, description)
    package: {
      description: { type: String, required: true },
      weight: { type: Number, required: true }, // in kg
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      }, // in cm
    },
    status: {
      type: String,
      enum: ['pending', 'matched', 'in-transit', 'delivered', 'cancelled', 'disputed'],
      default: 'pending',
    },
    fare: {
      type: Number, // Agreed fare for the delivery
      required: true,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // TODO: Add rating fields for both shipper and traveler after delivery
    shipperRating: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    travelerRating: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    // TODO: Add fields for tracking the delivery in real-time (e.g., current location)
    currentLocation: {
      address: { type: String },
      coords: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef Delivery
 */
const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;