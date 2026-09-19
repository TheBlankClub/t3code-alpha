import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as NodeSqliteClient from "@t3tools/shared/nodeSqliteClient";

import { runMigrations } from "../Migrations.ts";

it.layer(Layer.mergeAll(NodeSqliteClient.layer({ filename: ":memory:" })))(
  "052_ProjectionThreadTitleState",
  (it) => {
    it.effect("preserves existing titles and applies only once when reopening older state", () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* runMigrations({ toMigrationInclusive: 51 });
        yield* sql`
        INSERT INTO projection_threads (
          thread_id, project_id, title, model_selection_json, created_at, updated_at
        ) VALUES (
          'legacy-thread', 'legacy-project', 'My existing title',
          '{"provider":"codex","model":"gpt-5"}',
          '2026-09-14T00:00:00Z', '2026-09-14T00:00:00Z'
        )
      `;
        yield* runMigrations({ toMigrationInclusive: 52 });
        yield* runMigrations({ toMigrationInclusive: 52 });
        const rows = yield* sql<{
          readonly title: string;
          readonly title_state_json: string | null;
        }>`
        SELECT title, title_state_json FROM projection_threads WHERE thread_id = 'legacy-thread'
      `;
        assert.deepEqual([...rows], [{ title: "My existing title", title_state_json: null }]);
        const migrations = yield* sql`
        SELECT migration_id FROM effect_sql_migrations WHERE migration_id = 52
      `;
        assert.equal(migrations.length, 1);
      }),
    );
  },
);
