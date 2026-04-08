const mongoose = require('mongoose');

const FileFolderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: String,
      default: null,
      index: true,
    },
    depth: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

FileFolderSchema.index({ user: 1, parentId: 1, normalizedName: 1 }, { unique: true });

const FileFolder = mongoose.models.FileFolder || mongoose.model('FileFolder', FileFolderSchema);

module.exports = FileFolder;
