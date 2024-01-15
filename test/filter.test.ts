import { EmitterWebhookEvent } from '@octokit/webhooks';
import { eventFilter } from '../src/functions/filter';

describe('eventFilter', () => {
    it ('includes an event correctly', () => {
        const mockEvent = { name: 'secret_scanning_alert', payload: { action: 'created' } } as unknown as EmitterWebhookEvent;
        const allowed = eventFilter(mockEvent);
        expect(allowed).toBe(true);
    });

    it ('excludes an event correctly', () => {
        const mockEvent = { name: 'secret_scanning_alert_location', payload: { action: 'created' } } as unknown as EmitterWebhookEvent;
        const allowed = eventFilter(mockEvent);
        expect(allowed).toBe(false);
    });
})
