import { getDb } from '../db/connection.js';
import { SyncChangeset } from '../types/index.js';

export class ChangesetRepository {
  public static create(changeset: SyncChangeset): SyncChangeset {
    const db = getDb();
    db.prepare(`
      INSERT INTO sync_changesets (
        id, created_at, source, target, products, field_changes,
        validation_results, risk_level, approval_status, execution_status, applied_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      changeset.id,
      changeset.createdAt,
      changeset.source,
      changeset.target,
      JSON.stringify(changeset.products),
      JSON.stringify(changeset.fieldChanges),
      JSON.stringify(changeset.validationResults),
      changeset.riskLevel,
      changeset.approvalStatus,
      changeset.executionStatus,
      changeset.appliedAt || null
    );

    return changeset;
  }

  public static getById(id: string): SyncChangeset | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM sync_changesets WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      createdAt: row.created_at,
      source: row.source,
      target: row.target,
      products: JSON.parse(row.products || '[]'),
      fieldChanges: JSON.parse(row.field_changes || '[]'),
      validationResults: JSON.parse(row.validation_results || '{}'),
      riskLevel: row.risk_level,
      approvalStatus: row.approval_status,
      executionStatus: row.execution_status,
      appliedAt: row.applied_at || undefined,
    };
  }

  public static updateStatus(
    id: string,
    approvalStatus: SyncChangeset['approvalStatus'],
    executionStatus: SyncChangeset['executionStatus'],
    appliedAt?: string
  ): void {
    const db = getDb();
    db.prepare(`
      UPDATE sync_changesets
      SET approval_status = ?, execution_status = ?, applied_at = COALESCE(?, applied_at)
      WHERE id = ?
    `).run(approvalStatus, executionStatus, appliedAt || null, id);
  }
}
