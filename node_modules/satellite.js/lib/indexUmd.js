"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var constants = _interopRequireWildcard(require("./constants"));
var _ext = require("./ext");
var _io = require("./io");
var _propagation = require("./propagation");
var _SatRec = require("./propagation/SatRec.js");
var types = _interopRequireWildcard(require("./common-types.js"));
var _dopplerFactor = _interopRequireDefault(require("./dopplerFactor"));
var _transforms = require("./transforms");
var _sun = require("./sun");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
var _default = exports["default"] = Object.assign(Object.assign({
  constants: constants,
  // Propagation
  propagate: _propagation.propagate,
  sgp4: _propagation.sgp4,
  twoline2satrec: _io.twoline2satrec,
  json2satrec: _io.json2satrec,
  gstime: _propagation.gstime,
  jday: _ext.jday,
  invjday: _ext.invjday,
  dopplerFactor: _dopplerFactor["default"],
  // Coordinate transforms
  radiansToDegrees: _transforms.radiansToDegrees,
  degreesToRadians: _transforms.degreesToRadians,
  degreesLat: _transforms.degreesLat,
  degreesLong: _transforms.degreesLong,
  radiansLat: _transforms.radiansLat,
  radiansLong: _transforms.radiansLong,
  geodeticToEcf: _transforms.geodeticToEcf,
  eciToGeodetic: _transforms.eciToGeodetic,
  eciToEcf: _transforms.eciToEcf,
  ecfToEci: _transforms.ecfToEci,
  ecfToLookAngles: _transforms.ecfToLookAngles,
  // Sun Position
  sunPos: _sun.sunPos
}, types), {
  SatRecError: _SatRec.SatRecError
});