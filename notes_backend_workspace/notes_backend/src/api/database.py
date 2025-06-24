import os
import asyncpg
from dotenv import load_dotenv

from typing import Optional

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env"))

DB_URL = os.environ.get("SUPABASE_DB_URL")


class Database:
    """Manages the asyncpg database connection pool"""

    def __init__(self):
        self.pool: Optional[asyncpg.pool.Pool] = None

    async def connect(self):
        if not DB_URL:
            raise RuntimeError("SUPABASE_DB_URL not set in environment")
        self.pool = await asyncpg.create_pool(dsn=DB_URL, min_size=1, max_size=5)

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def fetch(self, query, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def execute(self, query, *args):
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)


# PUBLIC_INTERFACE
db = Database()
