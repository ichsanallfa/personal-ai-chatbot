import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedUser } from '../discordAccess.js';

test('allows the guild owner even if they are not in the allow-list', () => {
  const env = {
    ALLOWED_USER_IDS: '111111111111111111',
    DISCORD_OWNER_ID: '222222222222222222',
  };

  assert.equal(isAllowedUser('333333333333333333', env, { guildOwnerId: '333333333333333333' }), true);
});

test('allows any user when ALLOWED_USER_IDS is empty or set to * (Public Mode)', () => {
  assert.equal(isAllowedUser('999999999999999999', { ALLOWED_USER_IDS: '' }), true);
  assert.equal(isAllowedUser('999999999999999999', { ALLOWED_USER_IDS: '*' }), true);
  assert.equal(isAllowedUser('999999999999999999', { ALLOWED_USER_IDS: 'public' }), true);
});

test('blocks unlisted users when ALLOWED_USER_IDS has specific IDs (Private Mode)', () => {
  const env = { ALLOWED_USER_IDS: '111111111111111111', DISCORD_OWNER_ID: '222222222222222222' };
  assert.equal(isAllowedUser('999999999999999999', env), false);
});
