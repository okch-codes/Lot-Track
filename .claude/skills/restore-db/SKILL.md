---
name: restore-db
description: Restore the PostgreSQL database from the latest S3 backup dump.
disable-model-invocation: true
---

# restore-db

Restore the PostgreSQL database from the latest S3 backup dump.

## Instructions

Follow these steps to restore the database from the latest S3 backup:

### 1. Check AWS session

Run `aws s3 ls s3://backup-db-oci/ 2>&1` to verify the session is active.
If it says "session has expired", tell the user to run `aws login` in another terminal and wait for them to confirm before continuing.

### 2. Find the latest dump file

The S3 bucket structure is: `s3://backup-db-oci/YYYY/Month/PG_lotti.DD-Month-YYYY.dmp.gz`

To find the latest dump:
- List all year folders: `aws s3 ls s3://backup-db-oci/`
- Pick the latest year, then list month folders inside it
- Pick the latest month (use calendar order, not alphabetical), then list files inside it
- Pick the last file listed (they are date-ordered)

### 3. Download the dump

Download the latest dump file to `/tmp/`:
```
aws s3 cp s3://backup-db-oci/<year>/<month>/<filename> /tmp/<filename>
```

### 4. Ensure the DB container is running

Check that the `db` container is running with:
```
docker compose ps db
```
If it's not running, start it with `docker compose up -d db` and wait for it to be healthy.

Find the actual db container name with:
```
docker compose ps db --format '{{.Name}}'
```

### 5. Load environment variables

Read the `.env` file in the project root to get `POSTGRES_USER` and `POSTGRES_DB`.

### 6. Restore the database

Run these commands in sequence, using the container name from step 4:

```bash
# Decompress the dump
gunzip -f /tmp/<filename>
```

```bash
# Drop and recreate the public schema
docker exec -i <container_name> psql -U <POSTGRES_USER> -d <POSTGRES_DB> -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

```bash
# Restore the dump (the decompressed file will be .dmp without .gz)
cat /tmp/<filename_without_gz> | docker exec -i <container_name> pg_restore -U <POSTGRES_USER> -d <POSTGRES_DB> --no-owner --verbose
```

### 7. Clean up

Remove the downloaded dump files from `/tmp/`.

### 8. Confirm

Tell the user the restore is complete, mentioning which dump file was restored and its date.
