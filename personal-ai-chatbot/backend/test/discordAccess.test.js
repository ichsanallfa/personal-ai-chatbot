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

test('allows the configured owner id', () => {
  const env = {
    ALLOWED_USER_IDS: '111111111111111111',
    DISCORD_OWNER_ID: '222222222222222222',
  };

  assert.equal(isAllowedUser('222222222222222222', env), true);
});
