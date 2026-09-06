"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = propagate;
var _constants = require("../constants");
var _ext = require("../ext");
var _sgp = _interopRequireDefault(require("./sgp4"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function propagate(satrec) {
  for (var _len = arguments.length, jdayArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    jdayArgs[_key - 1] = arguments[_key];
  }
  // Return a position and velocity vector for a given date and time.
  var j = _ext.jday.apply(void 0, jdayArgs);
  var m = (j - satrec.jdsatepoch) * _constants.minutesPerDay;
  return (0, _sgp["default"])(satrec, m);
}