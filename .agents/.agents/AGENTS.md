# Local vs Remote Telegram Conflict Rule

**Context:** Telegram API throws 409 Conflict: terminated by other getUpdates request if two instances poll with the same Bot Token.
**Rule:** NEVER deploy to Oracle Cloud or restart the remote pp.py process without FIRST ensuring that the local Windows instance of pp.py has been terminated. Always run a check or kill local python processes running pp.py before executing the remote restart to prevent the remote server from crashing immediately upon boot.
