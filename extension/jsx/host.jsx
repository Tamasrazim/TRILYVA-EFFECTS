#target aftereffects

var TRILYVA = TRILYVA || {};

TRILYVA.ping = function () {
  try {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp instanceof CompItem)) {
      return JSON.stringify({ ok: false, message: "Open an After Effects composition to begin." });
    }
    return JSON.stringify({ ok: true, compName: comp.name });
  } catch (err) {
    return JSON.stringify({ ok: false, message: String(err) });
  }
};

TRILYVA._components = function (value) {
  if (typeof value === "number") return [value];
  if (value && typeof value.length === "number") {
    var result = [];
    for (var i = 0; i < value.length; i++) {
      if (typeof value[i] !== "number") return null;
      result.push(value[i]);
    }
    return result;
  }
  return null;
};

TRILYVA._clamp = function (value, low, high) {
  return Math.max(low, Math.min(high, value));
};

TRILYVA.applyCurve = function (x1, y1, x2, y2) {
  var undoOpen = false;
  try {
    x1 = Number(x1); y1 = Number(y1); x2 = Number(x2); y2 = Number(y2);
    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
      return JSON.stringify({ ok: false, message: "The curve values are invalid." });
    }

    x1 = TRILYVA._clamp(x1, 0.001, 0.999);
    x2 = TRILYVA._clamp(x2, x1, 0.999);
    y1 = TRILYVA._clamp(y1, -2, 3);
    y2 = TRILYVA._clamp(y2, -2, 3);

    var comp = app.project ? app.project.activeItem : null;
    if (!(comp instanceof CompItem)) {
      return JSON.stringify({ ok: false, message: "Open a composition first." });
    }

    var properties = comp.selectedProperties;
    var appliedProperties = 0;
    var skippedProperties = 0;
    var appliedPairs = 0;
    var outSlope = y1 / x1;
    var inSlope = (1 - y2) / (1 - x2);
    var outInfluence = TRILYVA._clamp(x1 * 100, 0.1, 100);
    var inInfluence = TRILYVA._clamp((1 - x2) * 100, 0.1, 100);

    app.beginUndoGroup("TRILYVA EDIT — Apply Curve");
    undoOpen = true;

    for (var p = 0; p < properties.length; p++) {
      var prop = properties[p];
      try {
        if (!prop || prop.propertyType !== PropertyType.PROPERTY || !prop.canVaryOverTime) {
          skippedProperties++;
          continue;
        }

        var selectedKeys = prop.selectedKeys;
        if (!selectedKeys || selectedKeys.length < 2) {
          skippedProperties++;
          continue;
        }

        selectedKeys.sort(function (a, b) { return a - b; });
        var propertyApplied = false;

        for (var k = 0; k < selectedKeys.length - 1; k++) {
          var startKey = selectedKeys[k];
          var endKey = selectedKeys[k + 1];

          // Only edit neighboring keys. A skipped key must not silently change timing.
          if (endKey !== startKey + 1) continue;

          var startValue = TRILYVA._components(prop.keyValue(startKey));
          var endValue = TRILYVA._components(prop.keyValue(endKey));
          var duration = prop.keyTime(endKey) - prop.keyTime(startKey);

          if (!startValue || !endValue || startValue.length !== endValue.length || duration <= 0) {
            continue;
          }

          var easeOut = [];
          var easeIn = [];
          for (var d = 0; d < startValue.length; d++) {
            var averageSpeed = (endValue[d] - startValue[d]) / duration;
            easeOut.push(new KeyframeEase(averageSpeed * outSlope, outInfluence));
            easeIn.push(new KeyframeEase(averageSpeed * inSlope, inInfluence));
          }

          prop.setInterpolationTypeAtKey(
            startKey,
            KeyframeInterpolationType.BEZIER,
            KeyframeInterpolationType.BEZIER
          );
          prop.setInterpolationTypeAtKey(
            endKey,
            KeyframeInterpolationType.BEZIER,
            KeyframeInterpolationType.BEZIER
          );

          prop.setTemporalEaseAtKey(
            startKey,
            prop.keyInTemporalEase(startKey),
            easeOut
          );
          prop.setTemporalEaseAtKey(
            endKey,
            easeIn,
            prop.keyOutTemporalEase(endKey)
          );

          appliedPairs++;
          propertyApplied = true;
        }

        if (propertyApplied) appliedProperties++;
        else skippedProperties++;
      } catch (propertyError) {
        skippedProperties++;
      }
    }

    app.endUndoGroup();
    undoOpen = false;

    if (appliedPairs === 0) {
      return JSON.stringify({
        ok: false,
        message: "No adjacent selected keyframe pairs found. Select two neighboring keys on a supported numeric property."
      });
    }

    return JSON.stringify({
      ok: true,
      message: "Applied to " + appliedPairs + " keyframe pair(s) across " +
        appliedProperties + " property/properties." +
        (skippedProperties ? " " + skippedProperties + " item(s) skipped." : "")
    });
  } catch (err) {
    if (undoOpen) {
      try { app.endUndoGroup(); } catch (ignore) {}
    }
    return JSON.stringify({ ok: false, message: "After Effects error: " + String(err) });
  }
};
