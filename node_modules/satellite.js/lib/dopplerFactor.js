"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = dopplerFactor;
var earthRotation = 7.292115E-5;
var c = 299792.458; // Speed of light in km/s
/**
 * Negative range rate means the satellite is moving towards the observer and
 * its frequency is shifted higher because 1 minus a negative range rate is
 * positive. If the range rate is positive, the satellite is moving away from
 * the observer and its frequency is shifted lower.
 */
function dopplerFactor(observerCoordsEcf, positionEcf, velocityEcf) {
  var rangeX = positionEcf.x - observerCoordsEcf.x;
  var rangeY = positionEcf.y - observerCoordsEcf.y;
  var rangeZ = positionEcf.z - observerCoordsEcf.z;
  var length = Math.sqrt(Math.pow(rangeX, 2) + Math.pow(rangeY, 2) + Math.pow(rangeZ, 2));
  var rangeVel = {
    x: velocityEcf.x + earthRotation * observerCoordsEcf.y,
    y: velocityEcf.y - earthRotation * observerCoordsEcf.x,
    z: velocityEcf.z
  };
  var rangeRate = (rangeX * rangeVel.x + rangeY * rangeVel.y + rangeZ * rangeVel.z) / length;
  return 1 - rangeRate / c;
}