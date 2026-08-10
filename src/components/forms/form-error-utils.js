export function applyApiValidationErrors(error, setError) {
  if (error?.code !== 'VALIDATION_ERROR' || !Array.isArray(error.details))
    return 0;

  let applied = 0;
  for (const detail of error.details) {
    if (
      detail?.location !== 'body' ||
      typeof detail.path !== 'string' ||
      !detail.path ||
      typeof detail.message !== 'string'
    ) {
      continue;
    }
    setError(detail.path, { type: 'server', message: detail.message });
    applied += 1;
  }
  return applied;
}
