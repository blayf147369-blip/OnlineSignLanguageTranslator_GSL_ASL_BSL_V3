# AI Sign Language Translator

A demo app with:
- FastAPI backend
- browser frontend
- microphone input
- text translation
- GSL, ASL, BSL selection
- animated avatar-style playback

Important limitation:
This project is a working demo and not a verified real sign-language engine. A still photo or simple avatar cannot perform true sign language without a rigged 3D avatar or licensed sign videos.

## Run backend
Open a terminal in the project folder and run:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## Open frontend
Open the `static/index.html` file directly in a browser, or serve the folder:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## API test
Health check:

```text
http://localhost:8000/api/health
```

Translate example:

```bash
curl -X POST http://localhost:8000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello friend", "language": "ASL"}'
```

## Notes
- The app supports GSL, ASL, and BSL as separate inputs.
- It uses a demo sign vocabulary only.
- If a word has no verified sign data, the app will show a warning message.
- For production-quality sign-language rendering, use a verified sign dictionary, a rigged 3D avatar, or licensed sign videos.
