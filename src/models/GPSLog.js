const mongoose = require('mongoose');
const { Schema } = mongoose;

const gpsLogSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true, // Ensure the type is explicitly set
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    // TODO: Add any additional fields that might be relevant for a GPS log, such as accuracy, speed, altitude, etc.
    accuracy: {
      type: Number,
      required: false,
    },
    speed: {
      type: Number,
      required: false,
    },
    altitude: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create a 2dsphere index for geospatial queries (if needed for real-time tracking visualization)
// This index should be on the 'location.coordinates' field.
gpsLogSchema.index({ 'location.coordinates': '2dsphere' });

/**
 * @typedef GPSLog
 */
const GPSLog = mongoose.model('GPSLog', gpsLogSchema);

module.exports = GPSLog;