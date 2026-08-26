const supportedSeparators = new Set(['/', '-', '.', '|', '·']);

export function normalizeLocationSeparator(separator) {
  return supportedSeparators.has(separator) ? separator : '/';
}

export function joinLocationCoordinates(coordinates, separator = '/') {
  const normalized = normalizeLocationSeparator(separator);
  const displaySeparator = normalized === '/' ? ' / ' : normalized;
  return coordinates.join(displaySeparator);
}

export function formatLocationReference(location) {
  return joinLocationCoordinates(
    [location.aisle, location.rack, location.level, location.position],
    location.warehouse?.locationSeparator,
  );
}
