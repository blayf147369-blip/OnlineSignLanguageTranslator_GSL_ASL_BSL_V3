from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from pydantic import BaseModel
import re

app = FastAPI(title="Sign Language Translator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslateRequest(BaseModel):
    text: str
    language: str

SUPPORTED_LANGUAGES = {"GSL", "ASL", "BSL"}

# Demo vocabulary only. This is not a verified sign dictionary.
# Replace with licensed sign clips or a verified dictionary for production.
DEMO_VOCAB = {
    "hello": {"GSL": ["HELLO"], "ASL": ["HELLO"], "BSL": ["HELLO"]},
    "good": {"GSL": ["GOOD"], "ASL": ["GOOD"], "BSL": ["GOOD"]},
    "morning": {"GSL": ["MORNING"], "ASL": ["MORNING"], "BSL": ["MORNING"]},
    "thank": {"GSL": ["THANK"], "ASL": ["THANK"], "BSL": ["THANK"]},
    "you": {"GSL": ["YOU"], "ASL": ["YOU"], "BSL": ["YOU"]},
    "friend": {"GSL": ["FRIEND"], "ASL": ["FRIEND"], "BSL": ["FRIEND"]},
    "please": {"GSL": ["PLEASE"], "ASL": ["PLEASE"], "BSL": ["PLEASE"]},
    "how": {"GSL": ["HOW"], "ASL": ["HOW"], "BSL": ["HOW"]},
    "are": {"GSL": ["ARE"], "ASL": ["ARE"], "BSL": ["ARE"]},
    "i": {"GSL": ["I"], "ASL": ["I"], "BSL": ["I"]},
    "am": {"GSL": ["AM"], "ASL": ["AM"], "BSL": ["AM"]},
    "fine": {"GSL": ["FINE"], "ASL": ["FINE"], "BSL": ["FINE"]},
    "school": {"GSL": ["SCHOOL"], "ASL": ["SCHOOL"], "BSL": ["SCHOOL"]},
    "work": {"GSL": ["WORK"], "ASL": ["WORK"], "BSL": ["WORK"]},
    "eat": {"GSL": ["EAT"], "ASL": ["EAT"], "BSL": ["EAT"]},
    "water": {"GSL": ["WATER"], "ASL": ["WATER"], "BSL": ["WATER"]},
    "family": {"GSL": ["FAMILY"], "ASL": ["FAMILY"], "BSL": ["FAMILY"]},
    "love": {"GSL": ["LOVE"], "ASL": ["LOVE"], "BSL": ["LOVE"]},
    "help": {"GSL": ["HELP"], "ASL": ["HELP"], "BSL": ["HELP"]},
}


def normalize_word(raw: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z']", "", raw.lower())
    return cleaned.strip()


def translate_to_demo_sequence(text: str, language: str):
    words = re.findall(r"[A-Za-z']+", text)
    sequence = []
    missing = []

    for word in words:
        key = normalize_word(word)
        if not key:
            continue
        if key in DEMO_VOCAB:
            sequence.extend(DEMO_VOCAB[key].get(language, [key.upper()]))
        else:
            missing.append(word)
            sequence.append(f"[{word.upper()}]")

    return sequence, missing


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "API is running",
        "supported_languages": sorted(SUPPORTED_LANGUAGES),
    }


@app.post("/api/translate")
def translate(request: TranslateRequest):
    text = (request.text or "").strip()
    language = (request.language or "").strip().upper()

    if not text:
        raise HTTPException(status_code=400, detail="Text is required.")

    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {language}. Use GSL, ASL, or BSL.",
        )

    sequence, missing_words = translate_to_demo_sequence(text, language)

    if missing_words:
        message = (
            "Some words do not have verified sign data for this language. "
            "The app is using demo vocabulary only."
        )
        verified = False
    else:
        message = "Demo vocabulary used for translation."
        verified = False

    return {
        "text": text,
        "language": language,
        "verified": verified,
        "message": message,
        "sequence": sequence,
        "missing_words": missing_words,
    }


project_dir = Path(__file__).resolve().parent.parent
static_dir = project_dir / "static"

if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
