import { metricsApiCopy } from '../../../utils/metricsApiCopy.js';
import { cloudinaryApiCopy } from '../../../utils/cloudinaryApiCopy.js';
import { testNotificationApiCopy } from '../../../utils/testNotificationApiCopy.js';

describe('admin/dev ApiCopy', () => {
  it('metricsApiCopy en inglés', () => {
    expect(metricsApiCopy('en').adminDenied).toMatch(/administrator/i);
  });

  it('cloudinaryApiCopy en inglés', () => {
    expect(cloudinaryApiCopy('en').resourceDeleted).toMatch(/deleted/i);
  });

  it('testNotificationApiCopy localiza mensaje de seguimiento', () => {
    expect(testNotificationApiCopy('en').followupTestMessage).toMatch(/24 hours/i);
    expect(testNotificationApiCopy('es').followupTestMessage).toMatch(/24 horas/i);
  });
});
