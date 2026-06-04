import { describe, it, expect } from 'vitest';
import {
	CYBERCLAW_ENTITY,
	DEVVM_ENTITY,
	AUTOMATE_LOOP_STAGES,
	CAMERA_FULL,
	CAMERA_ZOOM_VM,
	ENTITIES
} from '../diagramData.js';

describe('CYBERCLAW_ENTITY', () => {
	it('has the correct id and label', () => {
		expect(CYBERCLAW_ENTITY.id).toBe('cyberclaw');
		expect(CYBERCLAW_ENTITY.label).toBe('CYBERCLAW');
	});

	it('has a 3-element position tuple', () => {
		expect(CYBERCLAW_ENTITY.position).toHaveLength(3);
		for (const coord of CYBERCLAW_ENTITY.position) {
			expect(typeof coord).toBe('number');
		}
	});

	it('has a 3-element size tuple', () => {
		expect(CYBERCLAW_ENTITY.size).toHaveLength(3);
		for (const dim of CYBERCLAW_ENTITY.size) {
			expect(typeof dim).toBe('number');
		}
	});

	it('has a valid borderColor', () => {
		expect(CYBERCLAW_ENTITY.borderColor).toBe('#C9A227');
	});

	it('has sub-regions with required fields', () => {
		expect(CYBERCLAW_ENTITY.subRegions.length).toBeGreaterThan(0);
		for (const sr of CYBERCLAW_ENTITY.subRegions) {
			expect(sr.id).toBeTruthy();
			expect(sr.label).toBeTruthy();
			expect(typeof sr.x).toBe('number');
			expect(typeof sr.y).toBe('number');
			expect(typeof sr.width).toBe('number');
			expect(typeof sr.height).toBe('number');
		}
	});
});

describe('DEVVM_ENTITY', () => {
	it('has the correct id and label', () => {
		expect(DEVVM_ENTITY.id).toBe('devvm');
		expect(DEVVM_ENTITY.label).toBe('DEV VM');
	});

	it('has a 3-element position tuple', () => {
		expect(DEVVM_ENTITY.position).toHaveLength(3);
		for (const coord of DEVVM_ENTITY.position) {
			expect(typeof coord).toBe('number');
		}
	});

	it('has sub-regions including automate-loop', () => {
		const ids = DEVVM_ENTITY.subRegions.map((sr) => sr.id);
		expect(ids).toContain('automate-loop');
		expect(ids).toContain('cli-agent');
		expect(ids).toContain('validator');
		expect(ids).toContain('success-badge');
	});
});

describe('AUTOMATE_LOOP_STAGES', () => {
	it('has exactly 3 stages', () => {
		expect(AUTOMATE_LOOP_STAGES).toHaveLength(3);
	});

	it('contains diagnose, plan, implement in order', () => {
		expect(AUTOMATE_LOOP_STAGES[0].id).toBe('diagnose');
		expect(AUTOMATE_LOOP_STAGES[1].id).toBe('plan');
		expect(AUTOMATE_LOOP_STAGES[2].id).toBe('implement');
	});

	it('each stage has a label and description', () => {
		for (const stage of AUTOMATE_LOOP_STAGES) {
			expect(stage.label).toBeTruthy();
			expect(stage.description).toBeTruthy();
		}
	});
});

describe('camera presets', () => {
	it('CAMERA_FULL has 3-element position and lookAt', () => {
		expect(CAMERA_FULL.position).toHaveLength(3);
		expect(CAMERA_FULL.lookAt).toHaveLength(3);
	});

	it('CAMERA_ZOOM_VM has 3-element position and lookAt', () => {
		expect(CAMERA_ZOOM_VM.position).toHaveLength(3);
		expect(CAMERA_ZOOM_VM.lookAt).toHaveLength(3);
	});

	it('CAMERA_ZOOM_VM looks at the DevVM entity X position', () => {
		expect(CAMERA_ZOOM_VM.lookAt[0]).toBe(DEVVM_ENTITY.position[0]);
	});
});

describe('ENTITIES', () => {
	it('contains both entities', () => {
		expect(ENTITIES).toHaveLength(2);
		expect(ENTITIES[0]).toBe(CYBERCLAW_ENTITY);
		expect(ENTITIES[1]).toBe(DEVVM_ENTITY);
	});
});
