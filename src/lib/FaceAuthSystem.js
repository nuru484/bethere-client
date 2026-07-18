// src/lib/FaceAuthSystem.js
import * as faceapi from "face-api.js";
import { compareDescriptors, DESCRIPTOR_LENGTH } from "@/lib/face-math";

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
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");

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

  verifyFaceScan(descriptor1, descriptor2) {
    try {
      if (
        !descriptor1 ||
        !descriptor2 ||
        descriptor1.length !== descriptor2.length ||
        descriptor1.length !== DESCRIPTOR_LENGTH
      ) {
        return {
          success: false,
          message: "Invalid descriptors provided for comparison",
        };
      }

      const { isMatch, distance } = compareDescriptors(
        descriptor1,
        descriptor2,
        this.config.distanceThreshold
      );

      return {
        success: true,
        isMatch,
        message: isMatch
          ? "Face scan verified successfully"
          : "Face scan does not match",
        distance,
      };
    } catch (error) {
      console.error("Error in face scan verification:", error);
      return {
        success: false,
        message: "Verification failed: " + error.message,
      };
    }
  }

  async performLivenessCheck(imageSource, duration = 2000) {
    try {
      const centers = [];
      const expressionVariances = [];
      const startTime = Date.now();

      while (Date.now() - startTime < duration) {
        const results = await faceapi
          .detectSingleFace(imageSource, this.config.faceDetectorOptions)
          .withFaceLandmarks()
          .withFaceExpressions();

        if (!results) {
          console.warn("No face detected in liveness check frame");
          continue;
        }

        const box = results.detection.box;
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        centers.push({ x: centerX, y: centerY });

        const expressions = results.expressions;
        const exprValues = Object.values(expressions);
        const variance = this.calculateVariance(exprValues);
        expressionVariances.push(variance);

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (centers.length < 2) {
        console.warn("Insufficient frames for liveness check");
        return false;
      }

      const xMean = centers.reduce((sum, c) => sum + c.x, 0) / centers.length;
      const yMean = centers.reduce((sum, c) => sum + c.y, 0) / centers.length;
      const xVariance =
        centers.reduce((sum, c) => sum + Math.pow(c.x - xMean, 2), 0) /
        centers.length;
      const yVariance =
        centers.reduce((sum, c) => sum + Math.pow(c.y - yMean, 2), 0) /
        centers.length;
      const movementVariance = xVariance + yVariance;

      const avgExpressionVariance =
        expressionVariances.reduce((sum, v) => sum + v, 0) /
        expressionVariances.length;

      const movementThreshold = 10;
      const expressionThreshold = 0.01;
      const isLive =
        movementVariance > movementThreshold ||
        avgExpressionVariance > expressionThreshold;

      return isLive;
    } catch (error) {
      console.error("Error in liveness check:", error);
      return false;
    }
  }

  calculateVariance(array) {
    const mean = array.reduce((a, b) => a + b, 0) / array.length;
    const squareDiffs = array.map((value) => Math.pow(value - mean, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / array.length;
  }
}
