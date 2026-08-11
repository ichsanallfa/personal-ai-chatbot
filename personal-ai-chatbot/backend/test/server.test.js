import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFallbackReply, classifyMemoryCandidate } from '../server.js';

test('buildFallbackReply returns a helpful local response', () => {
  const reply = buildFallbackReply('siapa kamu', ['Nama penciptaku adalah Alfaa.']);

  assert.match(reply, /Lucy/i);
  assert.match(reply, /Alfaa/i);
});

test('classifyMemoryCandidate keeps important personal preferences as core memory', () => {
  const result = classifyMemoryCandidate('Saya suka kopi hitam setiap pagi dan saya sedang belajar React.');

  assert.equal(result.type, 'core');
  assert.ok(result.score >= 2);
});
