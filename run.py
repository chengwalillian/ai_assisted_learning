import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "Backend"))

import uvicorn

uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)