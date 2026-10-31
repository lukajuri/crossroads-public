import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const missions = JSON.parse(await readFile(new URL('../data/missions.json', import.meta.url), 'utf8'));
const publishedCourses = new Set([
  'Research Methodology and Analytical Tools',
  'International Trade, Logistics and Transport',
  'Reading and Resolving Conflict: Negotiation Techniques and Cognitive Processes',
  'Geopolitics of Resources, Maritime Space and the Deep Sea',
  'Geopolitics and Narrative',
  'Foundations of Political Geography and Geopolitics',
  'Global Balance of Power and Spheres of Influence',
  'Emerging Global Challenges in Geopolitics',
]);
const words = (value) => value.trim().split(/\s+/u).length;
const unique = (values) => new Set(values).size === values.length;

test('the complete set of eight distinct missions is available, including the introductory Koper mission', () => {
  assert.equal(missions.length, 8);
  assert.equal(missions[0].id, 'koper');
  assert.deepEqual(missions.map(m => m.id).sort(), ['canal', 'fimi', 'frontier', 'grain', 'koper', 'punjab', 'signal', 'water']);
  assert.ok(unique(missions.map(m => m.title)));
  assert.ok(unique(missions.map(m => m.assignment)));
});

for (const mission of missions) {
  test(`${mission.id}: a novice receives a concise assignment, sources and an achievable briefing`, () => {
    for (const key of ['title', 'kicker', 'location', 'category', 'role', 'teaser', 'openingBrief', 'assignment', 'supervisor', 'briefingPrompt', 'takeaway']) {
      assert.equal(typeof mission[key], 'string', key);
      assert.ok(mission[key].trim(), key);
    }
    for (const [key, limit] of [['teaser', 20], ['openingBrief', 65], ['assignment', 60], ['supervisor', 35]]) {
      assert.ok(words(mission[key]) <= limit, `${key} exceeds ${limit} words`);
    }
    assert.equal(mission.coordinates.length, 2);
    assert.ok(mission.coordinates.every(Number.isFinite));
    assert.ok(Math.abs(mission.coordinates[0]) <= 90);
    assert.ok(Math.abs(mission.coordinates[1]) <= 180);
    assert.equal(mission.stakes.length, 3);
    assert.ok(mission.concept.term && mission.concept.definition);
    assert.equal(mission.sources.length, 3);
    assert.ok(unique(mission.sources.map(source => source.id)));
    for (const source of mission.sources) {
      assert.match(source.id, /^[a-z0-9-]+$/u);
      assert.ok(source.title && source.kind);
      for (const [key, limit] of [['excerpt', 45], ['context', 20], ['insight', 30]]) {
        assert.equal(typeof source[key], 'string');
        assert.ok(source[key].trim());
        assert.ok(words(source[key]) <= limit, `${source.id}.${key} exceeds ${limit} words`);
      }
    }
  });

  test(`${mission.id}: evidence questions and developments have usable, distinct feedback`, () => {
    for (const stage of [mission.question, mission.development]) {
      assert.ok(stage.prompt || stage.question);
      assert.equal(stage.options.length, 3);
      assert.ok(unique(stage.options.map(option => option.id)));
      assert.ok(unique(stage.options.map(option => option.text)));
      assert.ok(unique(stage.options.map(option => option.feedback)));
      assert.ok(stage.options.some(option => option.quality === 2));
      assert.ok(stage.options.some(option => option.quality < 2));
      for (const option of stage.options) {
        assert.ok(option.text && option.feedback);
        assert.ok([0, 1, 2].includes(option.quality));
      }
    }
    const best = mission.question.options.find(option => option.id === mission.question.best);
    assert.ok(best, 'best answer resolves to an existing choice');
    assert.equal(best.quality, 2);
    assert.ok(mission.development.title && mission.development.text);
    assert.ok(words(mission.development.text) <= 55);
  });

  test(`${mission.id}: each response has an explicit cost and a distinct consequence`, () => {
    assert.equal(mission.choices.length, 3);
    assert.ok(unique(mission.choices.map(choice => choice.id)));
    assert.ok(unique(mission.choices.map(choice => choice.consequence)));
    assert.ok(mission.choices.some(choice => choice.quality === 2));
    assert.ok(mission.choices.some(choice => choice.quality < 2));
    for (const choice of mission.choices) {
      assert.match(choice.id, /^[a-z0-9-]+$/u);
      assert.ok(choice.title);
      assert.ok([0, 1, 2].includes(choice.quality));
      for (const [key, limit] of [['description', 25], ['tradeoff', 20], ['consequence', 40]]) {
        assert.ok(choice[key].trim());
        assert.ok(words(choice[key]) <= limit, `${choice.id}.${key} exceeds ${limit} words`);
      }
    }
  });

  test(`${mission.id}: career perspectives describe work and link to the published curriculum`, () => {
    assert.equal(mission.careers.length, 3);
    assert.ok(unique(mission.careers.map(career => career.id)));
    assert.ok(unique(mission.careers.map(career => career.task)));
    for (const career of mission.careers) {
      assert.match(career.id, /^[a-z0-9-]+$/u);
      for (const key of ['title', 'task', 'appeal', 'skill']) assert.ok(career[key]?.trim(), key);
    }
    assert.equal(mission.courses.length, 2);
    assert.ok(unique(mission.courses));
    for (const course of mission.courses) assert.ok(publishedCourses.has(course), `unverified course: ${course}`);
  });
}

test('mission copy avoids development labels and promises of career aptitude', () => {
  const copy = JSON.stringify(missions);
  assert.doesNotMatch(copy, /recruitment edition|placeholder|lorem ipsum|guaranteed job|career aptitude|perfect career/iu);
});
