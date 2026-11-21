import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRiskScore, clampScore, deriveRiskLevel } from './risk';

test('clampScore bounds values between 1 and 5', () => {
  assert.equal(clampScore(0), 1);
  assert.equal(clampScore(6), 5);
  assert.equal(clampScore(3.6), 4);
  assert.equal(clampScore(NaN), 1);
});

test('calculateRiskScore multiplies clamped likelihood and consequence', () => {
  assert.equal(calculateRiskScore(2, 3), 6);
  assert.equal(calculateRiskScore(5, 5), 25);
  assert.equal(calculateRiskScore(0, 4), 4);
});

test('deriveRiskLevel classifies low, medium, and high thresholds accurately', () => {
  assert.equal(deriveRiskLevel(1), 'low');
  assert.equal(deriveRiskLevel(6), 'low');
  assert.equal(deriveRiskLevel(7), 'medium');
  assert.equal(deriveRiskLevel(14), 'medium');
  assert.equal(deriveRiskLevel(15), 'high');
  assert.equal(deriveRiskLevel(25), 'high');
});
