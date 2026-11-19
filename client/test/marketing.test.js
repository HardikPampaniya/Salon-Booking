import test from 'node:test';
import assert from 'node:assert/strict';
import { isMetaPixelConfigured, normalizeCampaignAttribution, readMarketingConsent } from '../src/marketing.js';

test('classifies tagged Instagram and Facebook ads without retaining unrelated query data', () => {
  assert.deepEqual(normalizeCampaignAttribution('?utm_source=instagram&utm_medium=paid_social&utm_campaign=karanjade_launch_01&utm_content=feed', '', 'https://dreambeautystudio.in'), {
    channel: 'instagram_ad', source: 'instagram', medium: 'paid_social', campaign: 'karanjade_launch_01', content: 'feed',
  });
  assert.deepEqual(normalizeCampaignAttribution('?utm_source=facebook&utm_medium=cpc&utm_campaign=local_test', '', 'https://dreambeautystudio.in'), {
    channel: 'facebook_ad', source: 'facebook', medium: 'cpc', campaign: 'local_test',
  });
});

test('classifies organic social and referrals while discarding the raw referrer URL', () => {
  assert.equal(normalizeCampaignAttribution('', 'https://l.instagram.com/some/path?private=value', 'https://dreambeautystudio.in').channel, 'organic_instagram');
  assert.deepEqual(normalizeCampaignAttribution('', 'https://example.org/private/path?x=1', 'https://dreambeautystudio.in'), { channel: 'other_referral' });
  assert.deepEqual(normalizeCampaignAttribution('', '', 'https://dreambeautystudio.in'), { channel: 'direct' });
});

test('removes unsafe punctuation from campaign labels before persisting attribution', () => {
  const result = normalizeCampaignAttribution('?utm_source=instagram&utm_medium=paid_social&utm_campaign=launch%40home%2Ftest', '', 'https://dreambeautystudio.in');
  assert.equal(result.campaign, 'launchhometest');
});

test('keeps Pixel disabled until a public Pixel ID is configured and visitor consent exists', () => {
  assert.equal(isMetaPixelConfigured(), false);
  assert.equal(readMarketingConsent(), null);
});
