// src/lib/FaceAuthSystem.js
import * as faceapi from "face-api.js";

export class FaceAuthSystem {
  constructor(options = {}) {
    this.config = {
      minConfidence: 0.5,
      distanceThreshold: 0.6,
      faceDetectorOptions: new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.4,
      }),
      useFaceLandmarks: true,
      samplesForRegistration: 3,
      ...options,
    };

    this.modelsLoaded = false;
  }

  async initialize() {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      this.modelsLoaded = true;
      return true;
    } catch (error) {
      console.error("Error loading face-api.js models:", error);
      return false;
    }
  }

  async preprocessFace(imageInput) {
    if (!this.modelsLoaded) {
      throw new Error("Models not loaded. Call initialize() first");
    }

    try {
      const detections = await faceapi
        .detectAllFaces(imageInput, this.config.faceDetectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections || detections.length === 0) {
        console.warn("No faces detected in the image");
        return null;
      }

      const detection = detections.reduce((prev, current) =>
        prev.detection.score > current.detection.score ? prev : current
      );

      return detection;
    } catch (error) {
      console.error("Error in preprocessFace:", error);
      throw new Error("Face detection failed: " + error.message);
    }
  }

  async scanFace(imageSources) {
    if (!this.modelsLoaded) {
      return {
        success: false,
        message: "Face detection models not loaded.",
      };
    }

    if (!imageSources || imageSources.length === 0) {
      return { success: false, message: "No images provided for scanning" };
    }

    try {
      const descriptors = [];

      for (const imageSource of imageSources.slice(
        0,
        this.config.samplesForRegistration
      )) {
        const detection = await this.preprocessFace(imageSource);
        if (!detection || !detection.descriptor) {
          console.warn("Could not extract face from a sample");
          continue;
        }
        descriptors.push(Array.from(detection.descriptor));
      }

      if (descriptors.length < 2) {
        return {
          success: false,
          message: "Insufficient face descriptors extracted",
        };
      }

      // Average descriptors
      const avgDescriptor = new Float32Array(128);

      for (let i = 0; i < 128; i++) {
        avgDescriptor[i] =
          descriptors.reduce((sum, d) => sum + d[i], 0) / descriptors.length;
      }

      return {
        success: true,
        message: "Face scanned successfully",
        descriptor: Array.from(avgDescriptor),
      };
    } catch (error) {
      console.error("Error during face scanning:", error);
      return {
        success: false,
        message: "Face scanning failed: " + error.message,
      };
    }
  }
}
