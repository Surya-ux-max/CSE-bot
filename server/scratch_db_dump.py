from sqlalchemy import create_engine, text
from config import config

def main():
    engine = create_engine(config.database_url)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT * FROM meeting_participants"))
        rows = [dict(r._mapping) for r in res]
        print(f"Total participants in table: {len(rows)}")
        for idx, row in enumerate(rows[:10]):
            print(f"Row {idx}: email={row.get('user_email')} role={row.get('role')} status={row.get('status')}")

if __name__ == '__main__':
    main()
