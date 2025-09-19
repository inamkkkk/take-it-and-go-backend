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
  },
  {
    timestamps: true
  }
);

// Create a 2dsphere index for geospatial queries (if needed for real-time tracking visualization)
gpsLogSchema.index({ 'location.coordinates': '2dsphere' });

/**
 * @typedef GPSLog
 */
const GPSLog = mongoose.model('GPSLog', gpsLogSchema);

module.exports = GPSLog;
