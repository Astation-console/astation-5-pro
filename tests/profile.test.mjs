import test from 'node:test';
import assert from 'node:assert/strict';
import {profileSaveKey,LEGACY_SAVE_KEY} from '../src/systems/SaveManager.js';

test('legacy saves keep their original IndexedDB key',()=>{
 assert.equal(profileSaveKey('legacy'),LEGACY_SAVE_KEY);
 assert.equal(profileSaveKey(),LEGACY_SAVE_KEY);
});
test('separate player profiles cannot share the same save key',()=>{
 const a=profileSaveKey('p-user-a'),b=profileSaveKey('p-user-b');
 assert.notEqual(a,b);assert.notEqual(a,LEGACY_SAVE_KEY);assert.notEqual(b,LEGACY_SAVE_KEY);
});
test('malformed profile identifiers do not create unexpected keys',()=>{
 assert.equal(profileSaveKey('../../../oops'),LEGACY_SAVE_KEY);
 assert.equal(profileSaveKey('<script>'),LEGACY_SAVE_KEY);
});
