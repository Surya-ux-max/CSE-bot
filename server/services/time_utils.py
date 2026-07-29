from datetime import datetime, timedelta, timezone

# Indian Standard Time (Asia/Kolkata) is UTC + 5 hours 30 minutes
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime:
    """Returns the current date and time in Indian Standard Time (IST)."""
    return datetime.now(IST)

def get_ist_str(dt: datetime = None) -> str:
    """Formats a datetime object to a standard readable IST date & time string."""
    if dt is None:
        dt = get_ist_now()
    return dt.strftime("%Y-%m-%d %I:%M:%S %p")
