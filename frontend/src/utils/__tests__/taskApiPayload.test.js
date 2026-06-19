import { resolveCreatedTaskFromApi } from '../taskApiPayload';

describe('resolveCreatedTaskFromApi', () => {
  it('lee tarea en data', () => {
    const task = { _id: 'abc', title: 'Respirar' };
    expect(resolveCreatedTaskFromApi({ success: true, data: task })).toEqual(task);
  });

  it('lee tarea anidada en data.data', () => {
    const task = { _id: 'xyz', title: 'Caminar' };
    expect(resolveCreatedTaskFromApi({ data: { data: task } })).toEqual(task);
  });

  it('devuelve null sin id', () => {
    expect(resolveCreatedTaskFromApi({ data: { title: 'x' } })).toBeNull();
    expect(resolveCreatedTaskFromApi(null)).toBeNull();
  });
});
