/**
 * Tests: igualdad de snapshots de usuario (anti-cascada Auth → chat).
 */
import { areUserSnapshotsEqual, getUserSnapshotId } from '../userSnapshotEqual';

describe('userSnapshotEqual', () => {
  it('getUserSnapshotId lee _id o id', () => {
    expect(getUserSnapshotId({ _id: 'abc' })).toBe('abc');
    expect(getUserSnapshotId({ id: 'xyz' })).toBe('xyz');
    expect(getUserSnapshotId(null)).toBeNull();
  });

  it('areUserSnapshotsEqual es true para el mismo contenido', () => {
    const a = { _id: '1', preferences: { timezone: 'America/Santiago' } };
    const b = { _id: '1', preferences: { timezone: 'America/Santiago' } };
    expect(areUserSnapshotsEqual(a, b)).toBe(true);
  });

  it('areUserSnapshotsEqual es false si cambian preferences', () => {
    const a = { _id: '1', preferences: { timezone: 'Etc/UTC' } };
    const b = { _id: '1', preferences: { timezone: 'America/Santiago' } };
    expect(areUserSnapshotsEqual(a, b)).toBe(false);
  });

  it('areUserSnapshotsEqual es false con ids distintos', () => {
    expect(areUserSnapshotsEqual({ id: '1' }, { id: '2' })).toBe(false);
  });
});
