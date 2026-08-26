import { describe, expect, it } from 'vitest';
import {
  formatLocationReference,
  joinLocationCoordinates,
} from '@/modules/locations/location-reference.js';

describe('location reference formatter', () => {
  it('preserves the spaced slash presentation by default', () => {
    expect(joinLocationCoordinates(['A', 'R1', '2', '4'])).toBe(
      'A / R1 / 2 / 4',
    );
  });

  it('uses the separator configured by the warehouse', () => {
    expect(
      formatLocationReference({
        aisle: 'A',
        rack: 'R1',
        level: '2',
        position: '4',
        warehouse: { locationSeparator: '-' },
      }),
    ).toBe('A-R1-2-4');
  });

  it('falls back safely when an unsupported value is received', () => {
    expect(joinLocationCoordinates(['A', 'R1'], ':')).toBe('A / R1');
  });
});
