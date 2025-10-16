import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  bigint,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const pipelineNameEnum = pgEnum("pipeline_name", [
  "program",
  "aux1",
  "aux2",
  "aux3",
  "aux4",
  "aux5",
  "aux6",
  "aux7",
]);
export const outputProtocolEnum = pgEnum("output_protocol", [
  "rtmp",
  "srt",
  "whip",
]);
export const assetTypeEnum = pgEnum("asset_type", ["video", "image", "audio"]);
export const layerKindEnum = pgEnum("layer_kind", [
  "INPUT",
  "MEDIA",
  "TEXT",
  "COLOR",
  "HTML",
]);
export const ingestProtocolEnum = pgEnum("ingest_protocol", [
  "rtmp",
  "srt",
  "whip",
]);
export const ingestStatusEnum = pgEnum("ingest_status", [
  "online",
  "offline",
  "error",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passhash: text("passhash").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    ownerIdx: index("projects_owner_idx").on(table.ownerId),
    ownerNameIdx: uniqueIndex("projects_owner_name_idx").on(
      table.ownerId,
      table.name,
    ),
  }),
);

export const inputs = pgTable(
  "inputs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    path: text("path").notNull(),
    protocol: ingestProtocolEnum("protocol").notNull(),
    status: ingestStatusEnum("status").notNull().default("offline"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (table) => ({
    projectIdx: index("inputs_project_idx").on(table.projectId),
    projectNameIdx: uniqueIndex("inputs_project_name_idx").on(
      table.projectId,
      table.name,
    ),
  }),
);

export const pipelines = pgTable(
  "pipelines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: pipelineNameEnum("name").notNull(),
    state: jsonb("state")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdx: index("pipelines_project_idx").on(table.projectId),
    projectNameIdx: uniqueIndex("pipelines_project_name_idx").on(
      table.projectId,
      table.name,
    ),
  }),
);

export const outputs = pgTable(
  "outputs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    targetUrl: text("target_url").notNull(),
    protocol: outputProtocolEnum("protocol").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pipelineIdx: index("outputs_pipeline_idx").on(table.pipelineId),
  }),
);

export const layers = pgTable(
  "layers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    kind: layerKindEnum("kind").notNull(),
    sourceRef: text("source_ref"),
    params: jsonb("params")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    zIndex: integer("z_index").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
  },
  (table) => ({
    pipelineIdx: index("layers_pipeline_idx").on(table.pipelineId),
    zIndexIdx: index("layers_pipeline_z_idx").on(table.pipelineId, table.zIndex),
  }),
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: assetTypeEnum("type").notNull(),
    s3Key: text("s3_key").notNull(),
    meta: jsonb("meta")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    ownerIdx: index("assets_owner_idx").on(table.ownerId),
  }),
);

export const records = pgTable(
  "records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    s3Key: text("s3_key").notNull(),
    bytes: bigint("bytes", { mode: "bigint" }).notNull(),
    durationMs: integer("duration_ms"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => ({
    pipelineIdx: index("records_pipeline_idx").on(table.pipelineId),
  }),
);

export const ingestTokens = pgTable(
  "ingest_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdx: index("ingest_tokens_project_idx").on(table.projectId),
    tokenIdx: uniqueIndex("ingest_tokens_token_idx").on(table.token),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  assets: many(assets),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  inputs: many(inputs),
  pipelines: many(pipelines),
  ingestTokens: many(ingestTokens),
}));

export const pipelinesRelations = relations(pipelines, ({ many, one }) => ({
  project: one(projects, {
    fields: [pipelines.projectId],
    references: [projects.id],
  }),
  outputs: many(outputs),
  layers: many(layers),
  records: many(records),
}));

export const inputsRelations = relations(inputs, ({ one }) => ({
  project: one(projects, {
    fields: [inputs.projectId],
    references: [projects.id],
  }),
}));

export const outputsRelations = relations(outputs, ({ one }) => ({
  pipeline: one(pipelines, {
    fields: [outputs.pipelineId],
    references: [pipelines.id],
  }),
}));

export const layersRelations = relations(layers, ({ one }) => ({
  pipeline: one(pipelines, {
    fields: [layers.pipelineId],
    references: [pipelines.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  owner: one(users, {
    fields: [assets.ownerId],
    references: [users.id],
  }),
}));

export const recordsRelations = relations(records, ({ one }) => ({
  pipeline: one(pipelines, {
    fields: [records.pipelineId],
    references: [pipelines.id],
  }),
}));

export const ingestTokensRelations = relations(ingestTokens, ({ one }) => ({
  project: one(projects, {
    fields: [ingestTokens.projectId],
    references: [projects.id],
  }),
}));
