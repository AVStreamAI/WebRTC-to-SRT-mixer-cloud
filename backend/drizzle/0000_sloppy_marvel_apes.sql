DO $$ BEGIN
 CREATE TYPE "asset_type" AS ENUM('video', 'image', 'audio');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "ingest_protocol" AS ENUM('rtmp', 'srt', 'whip');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "ingest_status" AS ENUM('online', 'offline', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "layer_kind" AS ENUM('INPUT', 'MEDIA', 'TEXT', 'COLOR', 'HTML');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "output_protocol" AS ENUM('rtmp', 'srt', 'whip');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "pipeline_name" AS ENUM('program', 'aux1', 'aux2', 'aux3', 'aux4', 'aux5', 'aux6', 'aux7');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('admin', 'user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"type" "asset_type" NOT NULL,
	"s3_key" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingest_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"protocol" "ingest_protocol" NOT NULL,
	"status" "ingest_status" DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "layers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"kind" "layer_kind" NOT NULL,
	"source_ref" text,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"z_index" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"target_url" text NOT NULL,
	"protocol" "output_protocol" NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" "pipeline_name" NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"s3_key" text NOT NULL,
	"bytes" bigint NOT NULL,
	"duration_ms" integer,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"passhash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_owner_idx" ON "assets" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingest_tokens_project_idx" ON "ingest_tokens" ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ingest_tokens_token_idx" ON "ingest_tokens" ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inputs_project_idx" ON "inputs" ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "inputs_project_name_idx" ON "inputs" ("project_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "layers_pipeline_idx" ON "layers" ("pipeline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "layers_pipeline_z_idx" ON "layers" ("pipeline_id","z_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outputs_pipeline_idx" ON "outputs" ("pipeline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipelines_project_idx" ON "pipelines" ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pipelines_project_name_idx" ON "pipelines" ("project_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_owner_idx" ON "projects" ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "projects_owner_name_idx" ON "projects" ("owner_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "records_pipeline_idx" ON "records" ("pipeline_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingest_tokens" ADD CONSTRAINT "ingest_tokens_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inputs" ADD CONSTRAINT "inputs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "layers" ADD CONSTRAINT "layers_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outputs" ADD CONSTRAINT "outputs_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "records" ADD CONSTRAINT "records_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
