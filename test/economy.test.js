import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction } from '../server/simulation/economy.js';
import { parseAction } from '../server/validation.js';

test('validates typed actions and rejects unsafe values', () => {
  assert.deepEqual(parseAction({ type: 'hire', role: 'operator' }), { type: 'hire', role: 'operator' });
  assert.throws(() => parseAction({ type: 'price', value: 999 }));
  assert.throws(() => parseAction({ type: 'hire', role: 'admin' }));
});

test('economy actions mutate authoritative state', () => {
  const game = createGame();
  const startingCash = game.cash;
  applyAction(game, { type: 'hire', role: 'operator' });
  assert.equal(game.staff.operator, 2);
  assert.ok(game.cash < startingCash);
});

test('next-day simulation creates a financial period', () => {
  const game = createGame();
  const result = applyAction(game, { type: 'next-day' }, () => 0.5);
  assert.equal(game.day, 2);
  assert.equal(typeof result.profit, 'number');
  assert.equal(game.history.length, 1);
});
