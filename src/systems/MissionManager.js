import { StoryTracker } from './StoryCampaign.js';
export const GREEN_VALLEY_MISSION = Object.freeze({ id: 'green-valley', crystals: 6, terminals: 2, targetZ: -96 });
export class MissionManager {
  constructor(state = {}) {
    this.crystals = new Set(state.crystals ?? []);
    this.terminals = new Set(state.terminals ?? []);
    this.checkpoint = state.checkpoint ?? { x: 0, y: 3.1, z: 4 };
    this.defeatedEnemy = Boolean(state.defeatedEnemy);
    this.completed = Boolean(state.completed);
    this.failures = Number(state.failures) || 0;
    this.played = Number(state.played) || 0;
    this.story = new StoryTracker(state.storySeen);
    this.storyVersion = 1;
  }
  crystal(id) { if (this.crystals.has(id)) return false; this.crystals.add(id); return true; }
  terminal(id) { if (this.terminals.has(id)) return false; this.terminals.add(id); return true; }
  canComplete() { return this.crystals.size >= GREEN_VALLEY_MISSION.crystals && this.terminals.size >= GREEN_VALLEY_MISSION.terminals; }
  finish() { if (!this.canComplete()) return false; this.completed = true; return true; }
  progress() { return Math.round(Math.min(1, (Math.min(6,this.crystals.size)/6)*.6 + (Math.min(2,this.terminals.size)/2)*.4) * 100); }
  snapshot() { return { storyVersion:this.storyVersion, storySeen:this.story.snapshot(), crystals: [...this.crystals], terminals: [...this.terminals], checkpoint: { ...this.checkpoint }, defeatedEnemy: this.defeatedEnemy, completed: this.completed, failures: this.failures, played: this.played }; }
}
