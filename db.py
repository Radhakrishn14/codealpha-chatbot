import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = None
cursor = None

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    print("✅ Supabase Connected Successfully")

except Exception as e:
    print("❌ Database Connection Failed")
    print(e)