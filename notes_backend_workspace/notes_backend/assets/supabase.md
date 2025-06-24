# Supabase Integration for notes_backend

This backend uses Supabase as the cloud PostgreSQL backend for storing notes. All credentials are loaded from the `.env` file.

## Required Table Structure

Create a table in Supabase named `notes` with the following schema:

| Column    | Type      | Unique | Required | Default | Description          |
|-----------|-----------|--------|----------|---------|----------------------|
| id        | uuid      | Yes    | Yes      | gen_random_uuid() | Primary key    |
| title     | text      | No     | Yes      |         | Note title           |
| content   | text      | No     | Yes      |         | Note body/content    |
| created_at| timestamp | No     | Yes      | now()   | Creation timestamp   |
| updated_at| timestamp | No     | Yes      | now()   | Last modification    |

**You can create the table using SQL:**
```sql
create table notes (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);
```

## Environment Variables

- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_KEY`: Supabase Service Key or API Key (ensure appropriate policy restrictions)
- `SUPABASE_DB_URL`: PostgreSQL connection string

## Usage
The backend uses [asyncpg](https://github.com/MagicStack/asyncpg) for async Postgres operations.

Supabase authentication is via key, passed in headers. 

---

## References

- [Supabase Docs](https://supabase.com/docs)
- [asyncpg Docs](https://magicstack.github.io/asyncpg/current/)
