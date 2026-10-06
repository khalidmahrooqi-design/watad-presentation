import test from 'node:test';
import assert from 'node:assert/strict';
import { nextIndex, keyboardDelta, shouldIgnoreShortcut } from '../src/navigation.mjs';
test('navigation clamps at either end and advances between sections', () => {
  assert.equal(nextIndex(0, -1, 15), 0);
  assert.equal(nextIndex(14, 1, 15), 14);
  assert.equal(nextIndex(7, -1, 15), 6);
});
test('visual arrow directions mirror between Arabic and English', () => {
  assert.equal(keyboardDelta('ArrowRight', false), 1);
  assert.equal(keyboardDelta('ArrowRight', true), -1);
  assert.equal(keyboardDelta('ArrowLeft', true), 1);
  assert.equal(keyboardDelta('PageDown', true), 1);
  assert.equal(keyboardDelta('Home', true), 0);
});
test('local controls retain their keyboard input', () => {
  assert.equal(shouldIgnoreShortcut({ closest: () => ({}) }), true);
  assert.equal(shouldIgnoreShortcut({ closest: () => null }), false);
  assert.equal(shouldIgnoreShortcut(null), false);
});
